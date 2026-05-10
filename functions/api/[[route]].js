export async function onRequest(context) {
    const request = context.request;
    const url = new URL(request.url);

    // ONLY intercept if it's the second site experiencing the issue
    if (url.hostname === 'demo-sales.pages.dev') {
        // IMPORTANT: url.hostname MUST NOT contain 'https://'
        url.hostname = 'sales-worker.sagarabcdxyz3.workers.dev';
        return fetch(url.toString(), request);
    }

    // For the previous site, ignore this proxy and follow the normal flow
    return context.next();
}
