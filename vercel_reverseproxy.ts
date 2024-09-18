import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidUrl(u: string | URL) {
  try {
    new URL(u);
    return true;
  } catch (err) {
    return false;
  }
}

// Function to create a ReadableStream with replaced strings (better performance)
function replaceStringsInStream(
  input: ReadableStream<Uint8Array> | null,
  searchArray: { s: string; r: string }[],
): ReadableStream<Uint8Array> | null {
  if (!input) {
    return null;
  }

  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();

  // Convert search strings to Uint8Array
  const searchArrayUint8: { s: Uint8Array; r: string }[] = searchArray.map(
    ({ s, r }) => {
      return { s: textEncoder.encode(s), r };
    },
  );

  // Proper String replace using TextEn/Decoder
  const replaceInString = (
    str: string,
    replacements: { s: string; r: string }[],
  ): string => {
    return replacements.reduce(
      (resultStr, { s, r }) => resultStr.split(s).join(r),
      str,
    );
  };

  // Simple matcher on Uint8Array
  const containsSearchString = (
    chunk: Uint8Array,
    searchStringArray: { s: Uint8Array; r: string }[],
  ): boolean => {
    return searchStringArray.some(({ s }) => {
      let index = 0;
      while (index < chunk.length - s.length + 1) {
        // Search for the first byte of the search string
        index = chunk.indexOf(s[0], index);

        if (index === -1 || index >= chunk.length - s.length + 1) {
          break;
        }

        let match = true;
        for (let j = 1; j < s.length; j++) {
          if (chunk[index + j] !== s[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          return true;
        }

        // If no match, increment index to continue the search
        index++;
      }

      return false;
    });
  };

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk: Uint8Array, controller) {
      if (containsSearchString(chunk, searchArrayUint8)) {
        const originalChunk = textDecoder.decode(chunk);
        const modifiedChunk = replaceInString(originalChunk, searchArray);
        controller.enqueue(textEncoder.encode(modifiedChunk));
      } else {
        controller.enqueue(chunk);
      }
    },
  });

  return input.pipeThrough(transformStream);
}

// Vercel doesn't want you to know that you can (ab)use middleware for a reverse proxy ;-)
export async function reverseProxy(
  request: NextRequest,
  targetHost: string,
  replacements?: { s: string; r: string } | { s: string; r: string }[],
) {
  const url = new URL(request.url);

  // Create a new URL object with the target host
  const targetUrl = new URL(url.pathname, targetHost);

  // Forward query parameters if any
  if (url.search) {
    targetUrl.search = url.search;
  }

  // filter headers
  const filteredHeaders = new Headers();
  request.headers.forEach((value, name) => {
    if (name.startsWith("x-")) return;
    if (name.startsWith("host")) return;
    // if(name.startsWith('connection')) return;
    filteredHeaders.append(name, value);
  });

  // Set up request options
  const requestOptions: RequestInit = {
    method: request.method,
    headers: filteredHeaders,
    cache: request.cache,
    keepalive: request.keepalive,
    referrer: request.referrer,
    redirect: "manual",
  };

  // Include the request body for POST requests
  if (request.method === "POST") {
    requestOptions.body = await request.clone().text();
  }

  // Send the request to the target server
  const response = await fetch(targetUrl.toString(), requestOptions);

  // Handle redirects
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const redirectLocation = response.headers.get("location") || "/";
    // full url
    if (isValidUrl(redirectLocation)) {
      // rewrite url if necessarry to hide target host
      return NextResponse.redirect(
        redirectLocation?.replace(targetHost, request.url),
        response.status,
      );
    }
    // relative url
    else {
      // next.js needs a full url for redirect to works, so re-add the original host to relative ones
      return NextResponse.redirect(
        new URL(redirectLocation, request.url),
        response.status,
      );
    }
  }

  //replace strings in response body stream
  const body = !replacements
    ? response.body
    : replaceStringsInStream(
        response.body,
        Array.isArray(replacements) ? replacements : [replacements],
      );

  // Create a new proxied Response object with the fetched response
  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    //'type': response.type,
    url: response.url,
  });
}
