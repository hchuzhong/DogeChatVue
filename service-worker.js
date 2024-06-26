self.addEventListener('notificationclick', event => {
    event.notification.close();
    const {url, friendId} = event.notification.data;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            let clientToFocus = null;

            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) {
                    clientToFocus = client;
                    break;
                }
            }

            if (clientToFocus) {
                clientToFocus.focus().then(client => {
                    client.postMessage({ action: 'notification-clicked', friendId: friendId });
                });
            } else if (clients.openWindow) {
                clients.openWindow(url).then(newClient => {
                    newClient.postMessage({ action: 'notification-clicked', friendId: friendId });
                });
            }
        })
    );
});
