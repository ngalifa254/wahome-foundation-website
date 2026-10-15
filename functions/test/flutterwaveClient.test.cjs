const test = require("node:test");
const assert = require("node:assert/strict");
const {createHostedCheckout, verifyFlutterwaveTransaction} = require("../lib/flutterwaveClient.js");

function jsonResponse(body, status = 200) {
  return {ok: status >= 200 && status < 300, status, json: async () => body};
}

for (const method of ["mpesa", "card"]) {
  test(`creates a Flutterwave KES checkout for ${method}`, async () => {
    let request;
    const url = await createHostedCheckout({
      secretKey: "FLWSECK_TEST-mock",
      txRef: "WF-TEST-001",
      amountKes: 1000,
      method,
      returnUrl: "https://example.test/race",
      customer: {email: "runner@example.test", name: "Test Runner", phone: "254712345678"},
      registrationId: "registration-test-1",
      eventSlug: "miles-for-minds-2027",
      fetchImpl: async (input, init) => {
        request = {input, init};
        return jsonResponse({status: "success", data: {link: "https://checkout.flutterwave.test/session"}});
      },
    });
    assert.equal(url, "https://checkout.flutterwave.test/session");
    assert.equal(request.input, "https://api.flutterwave.com/v3/payments");
    assert.equal(request.init.headers.Authorization, "Bearer FLWSECK_TEST-mock");
    const body = JSON.parse(request.init.body);
    assert.equal(body.amount, 1000);
    assert.equal(body.currency, "KES");
    assert.equal(body.payment_options, method);
    assert.equal(body.customer.phonenumber, "254712345678");
    assert.equal(body.meta.registration_id, "registration-test-1");
  });
}

test("accepts only a verified KES payment with matching reference and amount", async () => {
  const payment = await verifyFlutterwaveTransaction({
    secretKey: "FLWSECK_TEST-mock",
    transactionId: 7654321,
    expectedTxRef: "WF-TEST-001",
    expectedAmountKes: 1000,
    fetchImpl: async () => jsonResponse({
      status: "success",
      data: {status: "successful", tx_ref: "WF-TEST-001", amount: 1000, currency: "KES", flw_ref: "FLW-MOCK-123"},
    }),
  });
  assert.equal(payment.data.flw_ref, "FLW-MOCK-123");
});

test("rejects a payment with a mismatched amount", async () => {
  const payment = await verifyFlutterwaveTransaction({
    secretKey: "FLWSECK_TEST-mock",
    transactionId: 7654321,
    expectedTxRef: "WF-TEST-001",
    expectedAmountKes: 1000,
    fetchImpl: async () => jsonResponse({
      status: "success",
      data: {status: "successful", tx_ref: "WF-TEST-001", amount: 1, currency: "KES"},
    }),
  });
  assert.equal(payment, null);
});
