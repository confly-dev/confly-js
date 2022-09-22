# Confly-js

## What you'll need

- [Node.js](https://nodejs.org/en/download/) version 16.14 or above:
  - When installing Node.js, make sure you have npm installed as well and everything added to path

Make sure you have `"type": "module"` in your `package.json`.

## Installation

Use ` $ npm i @confly-dev/confly-js` to add the package to your current project.

## Example

```js
import { getConfig } from "confly-js";

async function test() {
  const config = await getConfig("<instance_id>", "<token>");

  console.log(config);
}

test();
```

This example get's the values for the instance defined by the instance_id if the token provided has the correct authorization.

## getConfig

```js
getConfig(string | undefined, string | undefined);
```

The `getConfig()` function returns a promise for an object with the structure of your project and the values of a specific instance.

It takes two optional arguments that can otherwise be provided in an .env file.
