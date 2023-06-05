import {
  html,
  render,
} from "https://unpkg.com/lit-html@2.2.0/lit-html.js?module";

const IDP_ORIGIN_A = "https://idp-a-test.de/fedcm.json";
//const IDP_ORIGIN_B = "https://idp-b-test.de/fedcm.json";
const IDP_ORIGIN_B = "https://dry-lake-09460.herokuapp.com/fedcm.json";
//const IDP_ORIGIN = 'https://fedcm-idp-demo.glitch.me/'
const CLIENT_ID_A = "asdfasdfw23e4234qw";
const CLIENT_ID_B = "234q2asdfasdfasdfa";

// MultiIDP is only available as behind a feature flag
const providers = [
  /*{
    configURL: IDP_ORIGIN_A,
    clientId: CLIENT_ID_A,
  },*/
  {
    configURL: IDP_ORIGIN_B,
    clientId: CLIENT_ID_B,
  },
];

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

export const getCredential = async (config) => {
  const nonce = $('meta[name="nonce"]').content;

  const providersWithNonce = providers.map((provider) => {
    let newProvider = {
      ...provider,
      nonce: nonce,
    };

    // Only add the scope if it's defined
    if (config && config.scope) {
      newProvider.scope = config.scope;
    }

    return newProvider;
  });

  let identity = {
    providers: providersWithNonce,
  };

  // Only add the context if it's defined in the config
  if (config && config.context) {
    identity.context = config.context;
  }

  return navigator.credentials.get({
    identity: identity,
  });
};

export const handleConfigSave = async () => {
  const scopeInput = $("#scope-input").value.split(",");
  const contextInput = $("#context-input").value;
  const modeInput = $("#mode-input").value; // Get the value of the mode input field

  const response = await fetch("/config-save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scopeInput, contextInput, modeInput }), // Include modeInput in the object
  });

  if (response.ok) {
    // Configuration saved successfully, handle any necessary actions
    location.reload();
  } else {
    // Handle any error cases
    console.error("Failed to save configuration");
  }
};

export const switchTab = (tabId) => {
  // Hide all tabs
  $("#main-sections").classList.add("hidden");
  $("#settings-tab").classList.add("hidden");

  // Show the selected tab
  $(`#${tabId}`).classList.remove("hidden");
};

export const signout = (account_id) => async () => {
  try {
    loading.start();
    toast("You are signed out. Redirecting in 3.0 sec.");
    setTimeout(() => {
      location.href = "/signout";
    }, 3000);
  } catch (e) {
    loading.stop();
    console.error(e);
    toast(e.message);
  }
};

//
export const createIframe = (configURL, clientId, containerId) => {
    const iframe = document.createElement('iframe');
    iframe.src = `http://your-server/iframe?configURL=${encodeURIComponent(configURL)}&clientId=${encodeURIComponent(clientId)}`;
    iframe.referrerPolicy = 'origin';

    // Append the iframe to the specified container
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(iframe);
    } else {
      console.warn(`Container with id ${containerId} not found. Appending iframe to body.`);
      document.body.appendChild(iframe);
    }

    return iframe;
}
