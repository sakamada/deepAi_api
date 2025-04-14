const crypto = require('crypto');

// Generate a secure random encryption key 
const generateEncryptionKey = () => { 
  return crypto.randomBytes(32).toString('hex'); 
};

// Encrypt data 
const encrypt = (data, key) => { 
  try { 
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex'); 
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

// Decrypt data 
const decrypt = (encryptedData, iv, key) => { 
  try { 
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(key, 'hex'), 
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8'); 
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

module.exports = {
  generateEncryptionKey,
  encrypt,
  decrypt
};
