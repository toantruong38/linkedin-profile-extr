let originalHtml = undefined;

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  let data = undefined;

  for (;;) {
    const res = await new Promise((rs) => {
      chrome.tabs.sendMessage(tabs[0].id, { cmd: "requestProfile" }, (res) =>
        rs(res)
      );
    });
    if (!res) {
      return;
    }

    if (res.cmd === "wait") {
      document.getElementById("loading").style.visibility = "visible";
      document.getElementById("main-content").style.visibility = "hidden";

      await new Promise((rs) => setTimeout(() => rs(true), 1000));
      continue;
    } else if (res.cmd === "done") {
      console.log("request done", res.data);

      data = res.data;
      break;
    }
  }
  //restore original elements before injecting
  if (!originalHtml) {
    originalHtml = document.getElementById("main-content").innerHTML;
  } else {
    document.getElementById("main-content").innerHTML = originalHtml;
  }

  document.querySelector("#fullName").textContent = data.fullName;
  document.querySelector("#headline").textContent = data.headline;

  if (data.email) {
    document.querySelector("#email>small").textContent = data.email;
  }
  document.querySelector("#location>small").textContent = data.location;

  document.getElementById("profileImg").src = data.profileImg;

  const socialMediaEl = document.getElementById("sm-childs");

  data.socialMedia.forEach((obj) => {
    const div = document.createElement("div");
    div.className = "sm-child";

    const small = document.createElement("small");
    const a = document.createElement("a");
    a.href = obj.value;
    a.textContent = obj.value;

    small.appendChild(a);

    div.appendChild(small);

    socialMediaEl.appendChild(div);
  });

  const workingHistoryEl = document.getElementById("wh-content");
  data.workingHistory.reverse().forEach((obj) => {
    const itemContainer = document.createElement("div");
    itemContainer.className = "mt-2 wh-item";

    const role = document.createElement("div");
    const location = document.createElement("div");
    const time = document.createElement("div");
    time.className = "fw-lighter";

    role.textContent = obj.position;
    location.textContent = obj.companyName;
    time.textContent = `${
      obj.dateRange.start.month ? `${obj.dateRange.start.month}/` : ""
    }${obj.dateRange.start.year} - ${
      obj.dateRange.end
        ? `${obj.dateRange.end.month ? `${obj.dateRange.end.month}/` : ""}${
            obj.dateRange.end.year
          }`
        : "Present"
    }`;

    itemContainer.appendChild(role);
    itemContainer.appendChild(location);
    itemContainer.appendChild(time);

    workingHistoryEl.appendChild(itemContainer);
  });

  document.getElementById("loading").style.visibility = "hidden";
  document.getElementById("main-content").style.visibility = "visible";
});
