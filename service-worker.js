"use strict";

const CACHE_VERSION = "nexora-app-v7";
const APP_SHELL = [
  "/",
  "/index.html",
  "/shop.html",
  "/prebuilt.html",
  "/about.html",
  "/manifest.webmanifest",
  "/assets/css/style.css?v=20261111-5",
  "/assets/js/main.js?v=20261111-3",
  "/assets/js/install.js?v=20261109-1",
  "/assets/js/products.js?v=20261108-1",
  "/assets/js/pricing-data.js?v=20261111-3",
  "/assets/js/compatibility-data.js?v=20261111-1",
  "/assets/js/compatibility.js?v=20261111-1",
  "/assets/js/catalog-core.js?v=20261111-1",
  "/assets/js/ordering-core.js?v=20261111-2",
  "/assets/js/ordering.js?v=20261111-3",
  "/assets/js/shop.js?v=20261111-3",
  "/assets/js/prebuilt-data.js?v=20261111-3",
  "/assets/js/prebuilt-core.js?v=20261111-1",
  "/assets/js/prebuilt.js?v=20261111-2",
  "/assets/js/assistant.js?v=20261111-2",
  "/assets/js/accessibility.js?v=20261107-1",
  "/assets/images/nexora-mark.svg?v=20261107-2",
  "/assets/images/favicon.svg?v=20261107-2",
  "/assets/images/app-icon-192.png",
  "/assets/images/app-icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    return cache.addAll(APP_SHELL);
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.startsWith("nexora-app-") && key !== CACHE_VERSION;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(function (response) {
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); });
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match("/index.html");
      });
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (!response || response.status !== 200 || response.type === "opaque") return response;
      const copy = response.clone();
      caches.open(CACHE_VERSION).then(function (cache) { cache.put(request, copy); });
      return response;
    });
  }));
});
