// Minimal tests for CCValidator
(function() {
  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }
  var validator = new CCValidator();

  // Luhn valid Visa
  assert(validator.luhnCheck('4111111111111111'), 'Visa Luhn failed');
  // Luhn invalid
  assert(!validator.luhnCheck('4111111111111121'), 'Invalid Luhn passed');

  // Expiration valid
  var now = new Date();
  var mm = String(now.getMonth() + 1).padStart(2, '0');
  var yyyy = String(now.getFullYear() + 1);
  assert(validator.validateExpiration(mm, yyyy), 'Valid expiration failed');
  // Expiration invalid
  assert(!validator.validateExpiration('13', yyyy), 'Invalid month passed');

  // CVV valid
  assert(validator.validateCVV('123', 'visa'), 'Valid CVV failed');
  assert(!validator.validateCVV('12', 'visa'), 'Short CVV passed');

  // Card type detection
  var visa = validator.validateCard('4111111111111111|12|2099|123');
  assert(visa.valid && visa.type === 'visa', 'Visa card validation failed');
  var amex = validator.validateCard('371449635398431|12|2099|1234');
  assert(amex.valid && amex.type === 'amex', 'Amex card validation failed');
  var bad = validator.validateCard('1234567890123456|12|2099|123');
  assert(!bad.valid, 'Invalid card passed');

  // Batch processing
  validator.processBatch([
    '4111111111111111|12|2099|123',
    '371449635398431|12|2099|1234',
    '1234567890123456|12|2099|123'
  ], function() {}, function() {}).then(function(stats) {
    assert(stats.total === 3, 'Batch total wrong');
    assert(stats.valid === 2, 'Batch valid count wrong');
    window.TEST_PASS = true;
  });
})();
