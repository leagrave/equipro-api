const dns = require("dns").promises;
const net = require("net");

const PRIVATE_RANGES = [
  { from: "10.0.0.0", to: "10.255.255.255" },
  { from: "127.0.0.0", to: "127.255.255.255" },
  { from: "172.16.0.0", to: "172.31.255.255" },
  { from: "192.168.0.0", to: "192.168.255.255" },
  { from: "169.254.0.0", to: "169.254.255.255" },
];

const ipToLong = (ip) => ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0);

const isPrivateIP = (ip) => {
  if (!net.isIP(ip)) return true; // refuse non-IP
  const l = ipToLong(ip);
  return PRIVATE_RANGES.some(r => l >= ipToLong(r.from) && l <= ipToLong(r.to));
};

const validateOutboundURL = async (urlStr) => {
  const url = new URL(urlStr);
  const addrs = await dns.lookup(url.hostname, { all: true, verbatim: false });
  if (addrs.some(a => isPrivateIP(a.address))) {
    const e = new Error("Destination non autorisée");
    e.status = 400;
    throw e;
  }
  return true;
};

module.exports = { validateOutboundURL };
