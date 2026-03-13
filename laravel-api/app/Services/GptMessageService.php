<?php

namespace App\Services;

use App\Models\Member;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class GptMessageService
{
    private const MAX_CHARS = 1500;

    private array $systemPrompts = [
        'fr' => "Tu es un assistant qui rédige des messages WhatsApp courts et chaleureux pour demander des avis Trustpilot. Le message doit être en français, naturel, personnel, et contenir : une salutation avec le prénom, une demande courtoise d'avis Trustpilot, un exemple d'avis unique prêt à copier-coller entre guillemets (mentionnant subtilement le pays ou continent d'expatriation), et le lien Trustpilot. Le message entier NE DOIT PAS dépasser {MAX_CHARS} caractères. Réponds uniquement avec un JSON : {\"whatsapp_message\": \"...\"}",
        'en' => "You are an assistant writing short, warm WhatsApp messages to request Trustpilot reviews. The message must be in English, natural, personal, and contain: a greeting with the first name, a polite Trustpilot review request, a unique ready-to-paste example review (subtly mentioning the country/continent) between quotes, and the Trustpilot link. The full message MUST NOT exceed {MAX_CHARS} characters. Reply only with JSON: {\"whatsapp_message\": \"...\"}",
        'de' => "Du bist ein Assistent, der kurze, herzliche WhatsApp-Nachrichten schreibt, um Trustpilot-Bewertungen zu erbitten. Die Nachricht muss auf Deutsch sein, natürlich und persönlich, und enthalten: eine Begrüßung mit Vornamen, eine höfliche Bitte um eine Trustpilot-Bewertung, ein einzigartiges Beispiel einer Bewertung zum Kopieren (subtil das Auswandererland erwähnen) in Anführungszeichen und den Trustpilot-Link. Die gesamte Nachricht DARF {MAX_CHARS} Zeichen NICHT überschreiten. Antworte nur mit JSON: {\"whatsapp_message\": \"...\"}",
        'pt' => "Você é um assistente que escreve mensagens curtas e calorosas no WhatsApp para solicitar avaliações no Trustpilot. A mensagem deve estar em português, natural, pessoal e conter: uma saudação com o primeiro nome, um pedido cortês de avaliação no Trustpilot, um exemplo único de avaliação pronto para copiar (mencionando sutilmente o país/continente) entre aspas, e o link do Trustpilot. A mensagem completa NÃO DEVE exceder {MAX_CHARS} caracteres. Responda apenas com JSON: {\"whatsapp_message\": \"...\"}",
        'es' => "Eres un asistente que redacta mensajes cortos y cálidos de WhatsApp para solicitar reseñas en Trustpilot. El mensaje debe estar en español, natural, personal y contener: un saludo con el nombre, una solicitud amable de reseña en Trustpilot, un ejemplo único de reseña listo para copiar (mencionando sutilmente el país/continente) entre comillas, y el enlace de Trustpilot. El mensaje completo NO DEBE superar los {MAX_CHARS} caracteres. Responde solo con JSON: {\"whatsapp_message\": \"...\"}",
        'it' => "Sei un assistente che scrive messaggi WhatsApp brevi e calorosi per richiedere recensioni su Trustpilot. Il messaggio deve essere in italiano, naturale, personale e contenere: un saluto con il nome, una gentile richiesta di recensione su Trustpilot, un esempio unico di recensione pronto da copiare (citando il paese/continente) tra virgolette, e il link Trustpilot. Il messaggio completo NON DEVE superare i {MAX_CHARS} caratteri. Rispondi solo con JSON: {\"whatsapp_message\": \"...\"}",
        'nl' => "Je bent een assistent die korte, warme WhatsApp-berichten schrijft om Trustpilot-beoordelingen aan te vragen. Het bericht moet in het Nederlands zijn, natuurlijk, persoonlijk en bevatten: een begroeting met de voornaam, een beleefd verzoek om een Trustpilot-beoordeling, een uniek voorbeeld van een beoordeling om te kopiëren (subtiel het land vermelden) tussen aanhalingstekens, en de Trustpilot-link. Het volledige bericht MAG {MAX_CHARS} tekens NIET overschrijden. Antwoord alleen met JSON: {\"whatsapp_message\": \"...\"}",
        'ar' => "أنت مساعد يكتب رسائل واتساب قصيرة ودافئة لطلب تقييمات على Trustpilot. يجب أن تكون الرسالة باللغة العربية، طبيعية وشخصية وتحتوي على: تحية باسم الشخص، طلب مؤدب لتقييم Trustpilot، مثال فريد جاهز للنسخ (مع ذكر البلد بشكل خفيف) بين علامات اقتباس، ورابط Trustpilot. يجب ألا يتجاوز طول الرسالة الكاملة {MAX_CHARS} حرفاً. أجب فقط بـ JSON: {\"whatsapp_message\": \"...\"}",
        'zh' => "你是一个助手，负责编写简短温馨的WhatsApp消息，请求Trustpilot评价。消息必须用中文，自然、个人化，并包含：对名字的问候、礼貌的Trustpilot评价请求、一个独特的准备好复制粘贴的评价示例（略提国家/大陆）用引号括起来，以及Trustpilot链接。整条消息不得超过{MAX_CHARS}个字符。仅用JSON回复：{\"whatsapp_message\": \"...\"}",
    ];

    public function generateMessage(Member $member): ?string
    {
        $language = $member->primary_language ?: 'fr';
        $systemPrompt = str_replace(
            '{MAX_CHARS}',
            self::MAX_CHARS,
            $this->systemPrompts[$language] ?? $this->systemPrompts['fr']
        );

        // Fetch last 10 generated messages to ensure uniqueness
        $recentMessages = Member::whereNotNull('whatsapp_message')
            ->orderByDesc('generated_at')
            ->limit(10)
            ->pluck('whatsapp_message')
            ->toArray();

        $groups = $member->activeGroups()->pluck('name')->implode(', ');

        $userPrompt = implode("\n", array_filter([
            "Prénom/Nom affiché : " . ($member->display_name ?: 'membre'),
            "Pays : " . ($member->primary_country ?: 'non renseigné'),
            "Continent : " . ($member->primary_continent ?: 'non renseigné'),
            "Groupes WhatsApp : " . ($groups ?: 'SOS-Expat'),
            count($recentMessages)
                ? "Voici les " . count($recentMessages) . " derniers messages générés (génère un avis Trustpilot DIFFÉRENT de tous ceux-ci) :\n" . implode("\n---\n", $recentMessages)
                : null,
            "Lien Trustpilot à inclure : https://fr.trustpilot.com/review/sos-expat.com",
        ]));

        try {
            $response = OpenAI::chat()->create([
                'model'    => env('OPENAI_MODEL', 'gpt-4o'),
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $userPrompt],
                ],
                'response_format' => ['type' => 'json_object'],
                'max_tokens'      => 600,
                'temperature'     => 0.9,
            ]);

            $json    = json_decode($response->choices[0]->message->content, true);
            $message = $json['whatsapp_message'] ?? null;

            if (!$message) {
                Log::warning('GPT returned empty message', ['member_id' => $member->id]);
                return null;
            }

            // Enforce max length
            if (mb_strlen($message) > self::MAX_CHARS) {
                $message = mb_substr($message, 0, self::MAX_CHARS);
            }

            return $message;
        } catch (\Throwable $e) {
            Log::error('GPT generation failed', ['member_id' => $member->id, 'error' => $e->getMessage()]);
            return null;
        }
    }
}
