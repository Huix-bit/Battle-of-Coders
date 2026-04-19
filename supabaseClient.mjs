import { dirname, resolve, normalize } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function stripBom(text) {
    if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
    return text;
}

/** Same layering as Next: `.env` then `.env.local` (local overrides). */
function mergeEnvFile(relativePath) {
    const fullPath = resolve(__dirname, relativePath);
    if (!existsSync(fullPath)) return;
    const raw = stripBom(readFileSync(fullPath, 'utf8'));
    if (!raw.trim()) return;
    Object.assign(process.env, dotenv.parse(raw));
}

mergeEnvFile('.env');
mergeEnvFile('.env.local');

function isMainModule() {
    try {
        const here = normalize(fileURLToPath(import.meta.url)).toLowerCase();
        const entry = normalize(process.argv[1] ?? '').toLowerCase();
        return here === entry;
    } catch {
        return false;
    }
}

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

if (isMainModule()) {
    const missing = !String(supabaseUrl ?? '').trim() || !String(supabaseAnonKey ?? '').trim();
    if (missing) {
        const envLocal = resolve(__dirname, '.env.local');
        console.error(
            'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY after loading .env / .env.local.\n' +
                `Looked for: ${envLocal}\n` +
                'Save the file to disk if it is only open in the editor, and ensure both variables are set.'
        );
        process.exit(1);
    }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error('connection failed', error.message);
        return;
    }
    console.log('connection successful');
    console.log('data', data);
}

if (isMainModule()) {
    testConnection().catch((err) => console.error(err));
}
