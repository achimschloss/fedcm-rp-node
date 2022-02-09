const $ = document.querySelector.bind(document);

if (!'FederatedCredential' in window || !window.FederatedCredential.revoke) {
  $('#sign-in').addEventListener('click', e => {
    e.preventDefault();
    signIn();
  })
} else {
  $('#unsupported').classList.remove('hidden');  
}

const signIn = async () => {
  try {
    const result = await navigator.credentials.get({
      federated: {
        providers: [{
          url: '',
          clientId: '',
          nonce: 1111
        }]
      }
    })
  } catch (e) {
    console.error(e);
    toast(e);
  }
}

const toast = (text) => {
  $('#snackbar').labelText = text;
  $('#snackbar').show();
}
