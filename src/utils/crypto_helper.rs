use hex;
use sha2::{Sha512, Digest};

pub fn sha512(text: &str) -> String {
    let mut hasher = Sha512::new();
    hasher.update(text.as_bytes());
    let result = hasher.finalize();

    hex::encode(result)
}

pub fn salt_password(password: &str, salt: &str) -> String {
    let buf = format!("${}${}", sha512(password), salt);
    sha512(&buf)
}

pub fn random_string(length: i32) -> String {
    use rand::Rng;
    
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                            abcdefghijklmnopqrstuvwxyz\
                            0123456789";

    let mut rng = rand::rng();

    let randomed: String = (0..length)
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();

    return randomed;
}

pub fn random_string_lower(length: i32) -> String {
    use rand::Rng;
    
    const CHARSET: &[u8] = b"abcdefghijklmnopqrstuvwxyz\
                            0123456789";

    let mut rng = rand::rng();

    let randomed: String = (0..length)
        .map(|_| {
            let idx = rng.random_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();

    return randomed;
}

pub fn generate_salt() -> String {
    random_string(48)
}