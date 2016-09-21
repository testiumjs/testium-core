import ssh2 from 'ssh2';
import Bluebird from 'bluebird';

const hostKey = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA71O2DVsM32sWWRxGD4wRx/AxFFcPpu9KwJ2KstDG1DXqPN86
OfFCEqGgeQ5Oz+OXQq/fIOXg82ueex6Sr6bW/aM8sBxB87bA2CS7bG7VS6PJrx9u
9IEly7CzBuz3ePuO9DfrWz9UsMA5614sZbrecbIGrO+6KEFHzk2+rpMPea0+O1fq
hvO6pIVfhE1wI4sdjd4M8/joWfewe4Bn5oFYPvlTx9J4ws573+LUnts891lmFvXD
0nM43bFs5Ovn0amA83MPk4EdyOjLzZTBWxD4DS9C5u3Z1XOysYD9FWNB2DSipYuO
xVlT9maU23+c3BAOV1SveOX5exKHoEiAiHtDdQIDAQABAoIBAHzTRpL0uGQXMJLN
wmT9g5Cq4I5hUlKZYH3SLbNSXUH11PRm4bGy+elJz68UHVsks5IetNwtygRsTz6c
FZn0BRJJf6/DLUr2OOMDVZYawLkw9lKWrIJukc4JnXaxReoeGtOaDvGKuJtvx0XR
2oo8yyS12/F7H7c7RT5/IkNfhKTLCwHRMnaKGOyLkQ36ab8xhf/6T/4pd9PcKzr8
eupUcGOVawDCICaOJecr4jx1AXotjhm9f+FvSfUW4pV9bz0toxyQ+iCpoSTITQ/J
VlwVY5iNEVX7hgtKHkawJCCSX/AJ9qSoZ31LlHVXG0Y5XeEfyVPeI9E9iYx0gaEe
QuOFBckCgYEA+ZQpVLPcTLUISnADfDsPEJl9vcRWxAxvWf90YsNs0Bm0HG8tMgp+
toUYvhNrgR7Ltxrcr4WxVLFz0PF3gWz/75sRYHk1PZa0A7rzLg/gh68E6PdC19sZ
MokY6v06roKcUHdbC85FCcju/ht6S5Np1ctp+haUK9KfMfe3A/L2eMMCgYEA9XwG
55wlSeg0jwntegelRyKoaq7tCPyiCHPAPmydfbw6Af2zqfae2s8lJc4sB+I0+lj7
yK4+n34uuQ07mHJ+/wwcErLLuE4OPh5qlnGNKL2LYkGnl6dH3tTxQQRiB6AdT7B3
RQQHHELcIspZ6obQLDTsw1GfiV7UgBxaooL5z2cCgYBY0Krso5zwBzROGRKEcRfp
VlXy5B3kYnB13Hx0cQsV+y+nNsEkn6t8FF07tvl415azMHH8XF1AwG1wm51lh36E
q/BBHqEdq7Wf5jWH3MqQPm5G4Ub+Pc/3teYSKc9qLrylvfO+fcb/tmumLe0VW/47
wMmT39kWxzszsu2EEEA5tQKBgQCZxw4UPI5nU9zI1fE7hlqUyzMxUU8PWCKwpMIC
2Mt3nlfAM4s+p00vyJ9+pT6T2bJSOTfQqMZ15veh2JZCk0bWwmE7nWFcnRjy9N7U
S2Gf6czMylAQAixVfJN8pSA7oqN57hNo2nMR0xhPeu8EqVrytlyypgkIZq07a4ej
UeTndQKBgQDK4xfc3WgXWzuGHCDtESxnNVntrYvTld03OGnwDCxhmlXgdyw1qOn1
J+UIrqAQTmzgU+rTrz7SrPtl8V0PzySiyqo6qx/I/1BfVw893jtWj2zX2LuxBWAg
+O9MI/SyGfgAdm0FmNcnknLEJBuVqjxuKC2LdSZY2iRMoWQI0Lw6cQ==
-----END RSA PRIVATE KEY-----
`.trim();

function startSSHServer() {
  const opts = { hostKeys: [hostKey] };
  return new Bluebird(resolve => {
    const server = new ssh2.Server(opts, client => {
      client.on('authentication', ctx => { ctx.accept(); })
            .on('ready', () => {
              client.on('session', acceptSession => {
                const session = acceptSession();
                // something other than exec?
                session.once('exec', acceptExec => { acceptExec(); });
                // eslint-disable-next-line no-unused-vars
                session.on('request', (acceptReq, rejectReq, name, data) => {
                  acceptReq();
                });
                // eslint-disable-next-line no-unused-vars
                session.on('tcpip', (acceptT, rejectT, tData) => {
                  acceptT();
                });
              });
            });
    });
    server.listen(0, '127.0.0.1', function onListen() {
      resolve(this.address().port);
    });
  });
}

module.exports = startSSHServer;
