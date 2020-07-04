import middy from "@middy/core";
import cors from "@middy/http-cors";
import httpErrorHandler from "@middy/http-error-handler";

import _ from "lodash";
import AWS from "aws-sdk";

import config from './lib/aws';
import { BUCKET_NAME } from "./constants";

const S3 = new AWS.S3(config);

function getSignedUrl(uuid: string) {
  return new Promise((resolve, reject) => {
    S3.getSignedUrl(
      'getObject',
      {
        Bucket: BUCKET_NAME,
        Key: `${uuid}.pdf`,
        Expires: 180,
      },
      (err, signedData) => {
        if (err) {
          // Generic error.
          return reject({
            statusCode: 400,
            body: JSON.stringify({ error: "invalid or missing uuid" }),
          });
        }

        return resolve(signedData);
      }
    );
  })
}

async function getPdfUrl(event: any) {
  try {
    const uuid = _.get(event, "queryStringParameters.uuid", null);

    if (!uuid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "invalid or missing uuid" }),
      };
    }

    // Get S3 signed url if present
    let url = await getSignedUrl(uuid);

    const payload = {
      url
    }

    return {
      statusCode: 200,
      body: JSON.stringify(payload, null, 2),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
};

export const getPdfUrlHandler = middy(getPdfUrl)
  .use(cors())
  .use(httpErrorHandler());