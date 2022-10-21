const bitcoin = require('bitcoinjs-lib') // v4.x.x
const bitcoinMessage = require('bitcoinjs-message')
const ecc = require('tiny-secp256k1')
const { BIP32Factory } = require('bip32')
const bip32 = BIP32Factory(ecc)
const bip39 = require('bip39')

const DOGE_NETWORK =   {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bip32: {
      public: 0x02facafd,
      private: 0x02fac398
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e
  }





document.querySelector('#words').addEventListener('change', updateAddress)
document.querySelector('#index').addEventListener('change', updateAddress)

document.querySelector('#sign').addEventListener('click', sign)
document.querySelector('#setExampleSign').addEventListener('click', setExampleSign)
document.querySelector('#resetSign').addEventListener('click', resetSign)

document.querySelector('#verify').addEventListener('click', verify)
document.querySelector('#setExampleVerify').addEventListener('click', setExampleVerify)
document.querySelector('#resetVerify').addEventListener('click', resetVerify)

document.querySelector('#format-bip39').addEventListener('click', changeFormat)
document.querySelector('#format-privkey').addEventListener('click', changeFormat)

document.querySelector('#copy').addEventListener('click', () => {
  navigator.clipboard.writeText(document.querySelector('#signature-result').value);
})

function changeFormat(){
  let format = document.querySelector('input[name="format"]:checked').value;
  if (format === "bip39"){
    document.querySelector("#bip39-words").style.display = "block";
    document.querySelector("#privkey-key").style.display = "none";
  }
  else if (format === "privkey"){
    document.querySelector("#bip39-words").style.display = "none";
    document.querySelector("#privkey-key").style.display = "block";
  }
}
function updateAddress(){
  let words = document.querySelector('#words').value
  let index = document.querySelector('#index').value
  let seed = bip39.mnemonicToSeedSync(words)
  let node = bip32.fromSeed(seed, DOGE_NETWORK)
  let child = node.derivePath("m/44'/3'/0'/0/" + index)

  let { address: dogeCoinAddress } = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: DOGE_NETWORK,
  });

   document.querySelector('#dogecoin-address').value = dogeCoinAddress
}

function signMessageFromPrivkey(privkey, message){
  let keyPair = bitcoin.ECPair.fromWIF(privkey, DOGE_NETWORK)
  let privateKey = keyPair.privateKey
  let signature = bitcoinMessage.sign(message, privateKey, true, "\x19Dogecoin Signed Message:\n")

  return {
    signature: signature.toString('base64'),
    address: getDogecoinAddress(keyPair.publicKey)
  }
}

function signMessage(words, message, indexDerivation){
  let seed = bip39.mnemonicToSeedSync(words)
  let node = bip32.fromSeed(seed, DOGE_NETWORK)
  let child = node.derivePath("m/44'/3'/0'/0/" + indexDerivation)
  let signature = bitcoinMessage.sign(message, child.privateKey, true, "\x19Dogecoin Signed Message:\n")
  return {
    signature: signature.toString('base64'),
    address: getDogecoinAddress(child.publicKey)
  }
}
function sign(){
  let words = document.querySelector('#words').value
  let message = document.querySelector('#message').value
  let index = document.querySelector('#index').value
  let wif = document.querySelector('#wif').value
  let format = document.querySelector('input[name="format"]:checked').value

  let result
  if (format === "bip39"){
    result = signMessage(words, message, index)
  }
  else if (format === "privkey"){
    result = signMessageFromPrivkey(wif, message)
  }

  document.querySelector('#dogecoin-address').value = result.address
  document.querySelector('#signature-result').value = result.signature
  console.log(result.signature)
  
}
function verify(){
  let address = document.querySelector('#message-dogecoin-address').value
  let message = document.querySelector('#message-to-verify').value
  let signature = document.querySelector('#message-signature').value

  try {
    document.querySelector("#signature-error").textContent = ""

    let isValid = bitcoinMessage.verify(message, address, signature, "\x19Dogecoin Signed Message:\n")
    if (isValid){
      document.querySelector("#signature-isvalid").textContent = "Signature is valid"
    }
    else{
      document.querySelector("#signature-isvalid").textContent = "Signature is NOT valid"
    }
  } catch (error) {
    document.querySelector("#signature-isvalid").textContent = "Signature is NOT valid"
    document.querySelector("#signature-error").textContent = error
    console.log(error);
  }

}



function getDogecoinAddress(publicKey){
  const compressed = bitcoin.ECPair.fromPublicKey(publicKey, { compressed: true }).publicKey
  let { address: dogeCoinAddress } = bitcoin.payments.p2pkh({
    pubkey: compressed,
    network: DOGE_NETWORK,
  });
  return dogeCoinAddress
}



function setExampleSign() {
  document.querySelector('#words').value   = bip39.generateMnemonic()
  document.querySelector('#message').value = 'Hello world'
  document.querySelector('#index').value = "0"
  updateAddress()

}
function setExampleVerify() {
  let words = bip39.generateMnemonic()
  let {signature, address} = signMessage(words, "Hello world", 0)

  document.querySelector('#message-dogecoin-address').value = address
  document.querySelector('#message-to-verify').value = "Hello world"
  document.querySelector('#message-signature').value = signature

}
function resetSign(){
  document.querySelector('#words').value   = ''
  document.querySelector('#message').value = ''
  document.querySelector('#index').value   =  '0'
  document.querySelector('#dogecoin-address').value = ''
  document.querySelector('#signature-result').value = ''
  document.querySelector('#wif').value = ''
  

}
function resetVerify(){
  document.querySelector('#message-dogecoin-address').value = ''
  document.querySelector('#message-to-verify').value = ''
  document.querySelector('#message-signature').value = ''
}