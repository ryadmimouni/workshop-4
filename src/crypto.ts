import {webcrypto} from "crypto";

const iv = webcrypto.getRandomValues(new Uint8Array(16));

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const buff = Buffer.from(base64, "base64");
    return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
    publicKey: webcrypto.CryptoKey;
    privateKey: webcrypto.CryptoKey;
};

export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
    const encryptAlgorithm = {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        extractable: true,
        hash: "SHA-256"
    }

    const {publicKey, privateKey} = await webcrypto.subtle.generateKey(
        encryptAlgorithm,
        true,
        ["encrypt", "decrypt"]
    );

    return {publicKey, privateKey};
}


export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
    return arrayBufferToBase64(await webcrypto.subtle.exportKey("spki", key));
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
    key: webcrypto.CryptoKey | null
): Promise<string | null> {
    // TODO implement this function to return a base64 string version of a private key
    return key ? arrayBufferToBase64(await webcrypto.subtle.exportKey("pkcs8", key)) : null;
}

// Import a base64 string public key to its native format
export async function importPubKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
    // TODO implement this function to go back from the result of the exportPubKey function to it's native crypto key object
    return await webcrypto.subtle.importKey(
        "spki",
        base64ToArrayBuffer(strKey), {
            name: "RSA-OAEP",
            hash: "SHA-256"
        }, true, ["encrypt"]);
}

// Import a base64 string private key to its native format
export async function importPrvKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {
    // TODO implement this function to go back from the result of the exportPrvKey function to it's native crypto key object
    return await webcrypto.subtle.importKey(
        "pkcs8",
        base64ToArrayBuffer(strKey), {
            name: "RSA-OAEP",
            hash: "SHA-256"
        }, true, ["decrypt"]);
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
    b64Data: string,
    strPublicKey: string
): Promise<string> {
    const dataBuffer = base64ToArrayBuffer(b64Data);
    const publicKey = await importPubKey(strPublicKey);

    return arrayBufferToBase64(await webcrypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        publicKey,
        dataBuffer
    ));
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
    data: string,
    privateKey: webcrypto.CryptoKey
): Promise<string> {
    const dataBuffer = base64ToArrayBuffer(data);

    return arrayBufferToBase64(await webcrypto.subtle.decrypt(
        {
            name: "RSA-OAEP"
        },
        privateKey,
        dataBuffer
    ));
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {

    return await webcrypto.subtle.generateKey(
        {
            name: "AES-CBC",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {

    return arrayBufferToBase64(await webcrypto.subtle.exportKey("raw", key));
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
    strKey: string
): Promise<webcrypto.CryptoKey> {

    return await webcrypto.subtle.importKey(
        "raw",
        base64ToArrayBuffer(strKey),
        {
            name: "AES-CBC"
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
    key: webcrypto.CryptoKey,
    data: string
): Promise<string> {
    return arrayBufferToBase64(
        await webcrypto.subtle.encrypt(
            {
                name: "AES-CBC",
                iv: iv
            },
            key,
            new TextEncoder().encode(data)
        )
    );
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
    strKey: string,
    encryptedData: string
): Promise<string> {

    return new TextDecoder().decode(
        await webcrypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv: iv
            },
            await importSymKey(strKey),
            base64ToArrayBuffer(encryptedData)
        )
    );
}
