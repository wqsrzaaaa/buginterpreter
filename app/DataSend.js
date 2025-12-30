const DataSend = (textData) => {
  const scriptURL =
    "https://script.google.com/macros/s/AKfycbwNTLR5xgfIstH8FqBjM904aV6_u5U8HLcItHVVkoVhHnc4VFFdZChuBzh4MXvyjMzX/exec";

  fetch(scriptURL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ Text: textData }),
  })
    .then((response) => console.log("Success!", response))
    .catch((error) => console.error("Error!", error.message));
};

export default DataSend;
