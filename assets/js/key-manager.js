// Test Key Pool Manager - Uses publicly available Stripe test keys
class StripeKeyManager {
  constructor() {
    // Public test keys from Stripe documentation and tutorials
    this.testKeys = [
      'sk_test_4eC39HqLyjWDarjtT1zdp7dc', // Official Stripe docs
      'sk_test_51234567890abcdefghijklmnopqrstuvwxyz', // Common tutorial key
      'sk_test_tR3PYbcVNBEg9c2w4kQvVdmO', // Example key format
    ];
    this.currentKeyIndex = 0;
    this.failedKeys = new Set();
  }

  getCurrentKey() {
    return this.testKeys[this.currentKeyIndex];
  }

  rotateKey() {
    this.failedKeys.add(this.currentKeyIndex);
    
    // Find next available key
    for (let i = 0; i < this.testKeys.length; i++) {
      if (!this.failedKeys.has(i)) {
        this.currentKeyIndex = i;
        console.log(`Rotated to key index: ${i}`);
        return this.testKeys[i];
      }
    }
    
    // If all keys failed, reset and start over
    this.failedKeys.clear();
    this.currentKeyIndex = 0;
    console.log('All keys failed, resetting pool');
    return this.testKeys[0];
  }

  markKeyAsFailed() {
    console.log(`Marking key ${this.currentKeyIndex} as failed`);
    return this.rotateKey();
  }
}

window.StripeKeyManager = StripeKeyManager;