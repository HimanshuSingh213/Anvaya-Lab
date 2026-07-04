import type { BundledLanguage } from "shiki";

export type Lang = "cURL" | "Fetch" | "Axios" | "Python" | "Go";

export const LANGS: Lang[] = ["cURL", "Fetch", "Axios", "Python", "Go"];

interface Snippet {
    code: string;
    shikiLang: BundledLanguage;
    ext: string;
}

export const CODE_SNIPPETS: Record<Lang, Snippet> = {
    cURL: {
        ext: "sh",
        shikiLang: "bash",
        code: `curl --request GET \\
  --url 'https://api.github.com/users/octocat'`,
    },
    Fetch: {
        ext: "js",
        shikiLang: "javascript",
        code: `fetch("https://api.github.com/users/octocat", {
  method: "GET"
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`,
    },
    Axios: {
        ext: "js",
        shikiLang: "javascript",
        code: `import axios from "axios";

axios({
  "method": "get",
  "url": "https://api.github.com/users/octocat"
})
  .then(response => {
    console.log(response.status);
    console.log(response.data);
  })
  .catch(error => {
    console.error("Error:", error);
  });`,
    },
    Python: {
        ext: "py",
        shikiLang: "python",
        code: `import requests

url = "https://api.github.com/users/octocat"

response = requests.get(url)

print(response.status_code)
print(response.json())`,
    },
    Go: {
        ext: "go",
        shikiLang: "go",
        code: `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://api.github.com/users/octocat"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		panic(err)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	fmt.Println(res.StatusCode)
	fmt.Println(string(body))
}`,
    },
};
