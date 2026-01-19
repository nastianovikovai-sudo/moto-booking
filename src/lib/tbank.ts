import TbankPayments from "tbank-payments";

export const tbank = new TbankPayments({
  terminalKey: process.env.TBANK_TERMINAL_KEY!,
  password: process.env.TBANK_PASSWORD!
});

