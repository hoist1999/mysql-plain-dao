import dotenvFlow from 'dotenv-flow';

export async function loadEnvConfigAsync() {
    dotenvFlow.config();
}