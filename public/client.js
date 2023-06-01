import {
  html,
  render,
} from "https://unpkg.com/lit-html@2.2.0/lit-html.js?module";

const IDP_ORIGIN_A = "https://idp-a-test.de/fedcm.json";
const IDP_ORIGIN_B = "https://idp-b-test.de/fedcm.json";
//const IDP_ORIGIN_B = "https://dry-lake-09460.herokuapp.com/fedcm.json";
//const IDP_ORIGIN = 'https://fedcm-idp-demo.glitch.me/'
const CLIENT_ID_A = "asdfasdfw23e4234qw";
const CLIENT_ID_B = "234q2asdfasdfasdfa";

const providers = [
  {
    configURL: IDP_ORIGIN_A,
    clientId: CLIENT_ID_A,
  },
  {
    configURL: IDP_ORIGIN_B,
    clientId: CLIENT_ID_B,
  }
];

const scope = ['email', 'profile'];
const context = 'continue';


export const $ = document.querySelector.bind(document);

export const toast = (text) => {
  $("#snackbar").labelText = text;
  $("#snackbar").show();
};

export const displayProfile = (profile) => {
  render(html`<div></div>`, $("#profile"));
};

export const _fetch = async (path, payload = "") => {
  const headers = {
    "X-Requested-With": "XMLHttpRequest",
  };
  if (payload && !(payload instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(payload);
  }
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: headers,
    body: payload,
  });
  if (res.status === 200) {
    // Server authentication succeeded
    return res.json();
  } else {
    // Server authentication failed
    const result = await res.json();
    throw result.error;
  }
};

class Loading {
  constructor() {
    this.progress = $("#progress");
  }
  start() {
    this.progress.indeterminate = true;
  }
  stop() {
    this.progress.indeterminate = false;
  }
}

export const loading = new Loading();

export const getCredential = async (providers) => {
  const nonce = $('meta[name="nonce"]').content;
  
  // map over the providers array and create new objects that include the nonce
  const providersWithNonce = providers.map(provider => ({
    ...provider,
    scope: scope,
    nonce: nonce
  }));

  return navigator.credentials.get({
    identity: {
      providers: providersWithNonce,
      context: context
    }
  });
};

