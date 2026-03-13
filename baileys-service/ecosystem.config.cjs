module.exports = {
    apps: [{
        name: 'baileys-trustpilot',
        script: 'src/index.js',
        instances: 1,
        autorestart: true,
        max_restarts: 10,
        restart_delay: 5000,
        watch: false,
        env: {
            NODE_ENV: 'production',
        },
        error_file: 'logs/err.log',
        out_file: 'logs/out.log',
        merge_logs: true,
    }],
};
