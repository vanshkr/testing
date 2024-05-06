const MIVS = (function () {
  let apiKey;
  let translations;

  function initTranslation(options) {
    console.log('translation.js loaded');
    apiKey = options.apiKey;
    fetchTranslations()
      .then((data) => {
        translations = updateTranslations(data, options);
        const languageSwitcher = createLanguageSwitcherDropdown(
          translations.languages
        );
        document.body.appendChild(languageSwitcher);
      })
      .catch((error) => console.error("Error fetching translations:", error));
  }

  // function fetchTranslations() {
  //   return fetch("/translations.json")
  //     .then((response) => response.json())
  //     .catch((error) => {
  //       console.error("Error fetching translations:", error);
  //       throw error;
  //     });
  // }
  function fetchTranslations() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const settings = {
        language: "en",
        theme: "dark",
        notifications: true,
        preferences: {
          autoSave: true,
          defaultFont: "Arial"
        },
         languages: ["en", "fr", "es", "de", "zh", "ar"]
      };
      resolve(settings);
    }, 2000);
  });
}

  function updateTranslations(data, options) {
    const updatedData = { ...data };
    for (const key in options) {
      if (key !== 'apiKey' && updatedData.hasOwnProperty(key)) {
        updatedData[key] = options[key];
      }
    }
    return updatedData;
  }

  async function extractAndTranslateTextNodes(targetLang) {
    let uniqueId = 0;
    const textNodeData = [];
    const parentNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      const text = currentNode.textContent;
      currentNode.parentNode.setAttribute("data-mivs-id", ++uniqueId);
      if (text) {
        textNodeData.push({ text, uniqueId });
        parentNodes.push(currentNode.parentNode);
      }
      currentNode = walker.nextNode();
    }
    console.log(textNodeData)
    const translatedTextNodes = await translateTextNodes(
      textNodeData,
      targetLang
    );

    replaceTextNodes(textNodeData, translatedTextNodes);
  }

  async function translateTextNodes(textNodeData, targetLang) {
    const response = await fetch("http://localhost:5000/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ textNodes: textNodeData, targetLang }),
    });

    if (!response.ok) {
      throw new Error("Failed to translate text nodes");
    }

    const translatedTextNodes = await response.json();
    return translatedTextNodes;
  }

  async function replaceTextNodes(
    originalTextNodesData,
    translatedTextNodesData
  ) {
    const treeWalker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.textContent.trim() && node.position === null) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false
    );

    const nodesToUpdate = [];

    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      const text = currentNode.textContent;
      if (text) {
        const parentNode = currentNode.parentNode;
        const id = parentNode.getAttribute("data-mivs-id");
        const translatedText = translatedTextNodesData.find((node) => {
          return node.uniqueId === parseInt(id);
        });
        const originalTextNode = originalTextNodesData.find((node) => {
          return node.uniqueId === parseInt(id);
        });
        if (translatedText && originalTextNode) {
          nodesToUpdate.push({
            node: parentNode,
            translatedText: translatedText.text,
          });
        }
      }

      currentNode = treeWalker.nextNode();
    }

    for (const { node, translatedText } of nodesToUpdate) {
      node.textContent = translatedText;
    }
  }

  function createLanguageSwitcherDropdown(languages) {
    const dropdownContainer = document.createElement("div");
    dropdownContainer.style.position = "fixed";
    dropdownContainer.style.bottom = "20px";
    dropdownContainer.style.right = "20px";

    const dropdownToggle = document.createElement("button");
    dropdownToggle.textContent = "Switch Language";
    dropdownToggle.classList.add("dropdown-toggle");

    const dropdownMenu = document.createElement("div");
    dropdownMenu.classList.add("dropdown-menu");

    languages.forEach((lang) => {
      const langOption = document.createElement("button");
      langOption.textContent = lang;
      langOption.classList.add("dropdown-item");
      langOption.addEventListener("click", () => {
        extractAndTranslateTextNodes(lang);
      });
      dropdownMenu.appendChild(langOption);
    });

    dropdownContainer.appendChild(dropdownToggle);
    dropdownContainer.appendChild(dropdownMenu);

    dropdownToggle.addEventListener("click", () => {
      dropdownMenu.classList.toggle("show");
    });

    return dropdownContainer;
  }

  return {
    initialize: initTranslation,
    fetchTranslations: fetchTranslations,
  };
})();
window.MIVS = MIVS;
console.log(window.MIVS);
