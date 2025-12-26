import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppwosxtnljyqoenrolwo.supabase.co';
const supabaseKey = 'sb_publishable_0kGEMPBxuR6Z-7aeRGSVkQ_awaaQt4S'; // From .env

const supabase = createClient(supabaseUrl, supabaseKey);

async function signUpAdmin() {
    const email = 'redsparks184@gmail.com';
    const password = '249540';

    console.log(`Attempting to sign up ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log('User already registered. Proceeding to role assignment via migration.');
        } else {
            console.error('Error signing up:', error.message);
        }
    } else {
        console.log('User signed up successfully:', data.user?.id);
    }
}

signUpAdmin();
