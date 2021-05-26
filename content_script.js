let popupData = undefined;
const domParser = new DOMParser();

chrome.runtime.onMessage.addListener((req, sender, res) => {
  if (!popupData) {
    res({ cmd: "wait" });
  } else {
    res({ cmd: "done", data: popupData });
  }
});

const fetchProfile = async () => {
  const doc = domParser.parseFromString(
    // document.documentElement.outerHTML,
    await fetch(window.location.href).then((res) => res.text()),
    "text/html"
  );

  const codeEls = Array.from(doc.querySelectorAll("code"));

  const codeEl = codeEls.find((el) =>
    el.innerText?.includes("identity.profile.FullProfileWithEntities-73")
  );

  const codeJson = JSON.parse(codeEl.innerText);

  const json = JSON.parse(
    codeEls.find((el) => el.getAttribute("id") === codeJson.body).innerText
  );

  const profileObj = json.included.find(
    (obj) =>
      obj["$type"] === "com.linkedin.voyager.dash.identity.profile.Profile"
  );

  const out = {
    email: null,
    socialMedia: [],
    workingHistory: [],
    fullName: `${profileObj.firstName} ${profileObj.lastName}`,
    headline: profileObj.headline,
    profileImg: document.querySelector(
      `img[id*=ember][class*=pv-top-card__photo]`
    ).src,
  };

  out.location = json.included.find(
    (obj) =>
      obj["$type"] === "com.linkedin.voyager.dash.identity.profile.Position"
  ).locationName;

  out.socialMedia.push({
    domain: "linkedin.com",
    value: `https://linkedin.com/in/${profileObj.publicIdentifier}`,
  });

  out.workingHistory = json.included
    .filter(
      (obj) =>
        obj["$type"] === "com.linkedin.voyager.dash.identity.profile.Position"
    )
    .map((obj) => {
      const { dateRange, companyName, title: position } = obj;

      delete dateRange["$type"];
      delete dateRange.start["$type"];
      if (dateRange.end) {
        delete dateRange.end["$type"];
      }

      return { dateRange, companyName, position };
    });

  const detailsText = await fetch(
    `https://www.linkedin.com/in/${profileObj.publicIdentifier}/detail/contact-info/`
  )
    .then((resp) => resp.text())
    .catch((err) => {
      console.log(err);
      return null;
    });
  if (detailsText) {
    const doc = domParser.parseFromString(detailsText, "text/html");

    const codeEls = Array.from(doc.querySelectorAll("code"));

    const codeEl = codeEls.find((el) =>
      el.innerText.includes(`${profileObj.publicIdentifier}/profileContactInfo`)
    );
    if (codeEl) {
      const codeJson = JSON.parse(codeEl.innerText);

      const json = JSON.parse(
        codeEls.find((el) => el.getAttribute("id") === codeJson.body).innerText
      );

      out.email = json.data.emailAddress;
    }
  }
  console.log(out);

  popupData = out;
};

(() => {
  let url = undefined;
  console.info("Initialized url changes listener");

  setInterval(() => {
    if (window.location.href !== url) {
      url = window.location.href;

      console.info("url changed", url);

      popupData = undefined;

      fetchProfile();
    }
  }, 1000);
})();

// chrome.runtime.onMessage.addListener(async function (
//   request,
//   sender,
//   sendResponse
// ) {
//   if (!request || !request.cmd) {
//     return;
//   }

//   const domParser = new DOMParser();

//   switch (request.cmd) {
//     case "fetchProfile":
//       const doc = domParser.parseFromString(
//         document.documentElement.outerHTML,
//         "text/html"
//       );

//       const codeEls = Array.from(doc.querySelectorAll("code"));

//       const codeEl = codeEls.find((el) =>
//         el.innerText?.includes("identity.profile.FullProfileWithEntities-73")
//       );

//       const codeJson = JSON.parse(codeEl.innerText);

//       const json = JSON.parse(
//         codeEls.find((el) => el.getAttribute("id") === codeJson.body).innerText
//       );

//       const profileObj = json.included.find(
//         (obj) =>
//           obj["$type"] === "com.linkedin.voyager.dash.identity.profile.Profile"
//       );

//       const out = {
//         email: "currently_not_found",
//         socialMedia: [],
//         workingHistory: [],
//         fullName: `${profileObj.firstName} ${profileObj.lastName}`,
//         headline: profileObj.headline,
//         profileImg: document.querySelector(
//           `img[id*=ember][class*=pv-top-card__photo]`
//         ).src,
//       };

//       out.location = json.included.find(
//         (obj) =>
//           obj["$type"] === "com.linkedin.voyager.dash.identity.profile.Position"
//       ).locationName;

//       out.socialMedia.push({
//         domain: "linkedin.com",
//         value: `https://linkedin.com/in/${profileObj.publicIdentifier}`,
//       });

//       out.workingHistory = json.included
//         .filter(
//           (obj) =>
//             obj["$type"] ===
//             "com.linkedin.voyager.dash.identity.profile.Position"
//         )
//         .map((obj) => {
//           const { dateRange, companyName, title: position } = obj;

//           delete dateRange["$type"];
//           delete dateRange.start["$type"];
//           if (dateRange.end) {
//             delete dateRange.end["$type"];
//           }

//           return { dateRange, companyName, position };
//         });

//       const detailsText = await fetch(
//         `https://www.linkedin.com/in/${profileObj.publicIdentifier}/detail/contact-info/`
//       )
//         .then((resp) => resp.text())
//         .catch((err) => {
//           console.log(err);
//           return null;
//         });
//       if (detailsText) {
//         const doc = domParser.parseFromString(detailsText, "text/html");

//         const codeEls = Array.from(doc.querySelectorAll("code"));

//         const codeEl = codeEls.find((el) =>
//           el.innerText.includes(
//             `${profileObj.publicIdentifier}/profileContactInfo`
//           )
//         );
//         if (codeEl) {
//           const codeJson = JSON.parse(codeEl.innerText);

//           const json = JSON.parse(
//             codeEls.find((el) => el.getAttribute("id") === codeJson.body)
//               .innerText
//           );

//           out.email = json.data.emailAddress;
//         }
//       }
//       console.log(out);

//       popupData = out;
//       sendResponse(out);

//       break;

//     case "init":
//       sendResponse({ msg: "ok" });
//       break;

//     case "requestProfile":
//       sendResponse(popupData);
//       break;

//     default:
//       console.info("Unknown command");
//   }
// });
