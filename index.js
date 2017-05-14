var functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.notificationListener = functions.database.ref('/users/{childs}/notification')
    .onWrite(event => {
        var notification = event.data.val();
        console.log('notification update: ' + notification);
        if (notification) {
            const key = event.data.ref.parent.key;
            console.log('the key is:' + key);
            notificationCounter(key);
        } else {
            return;
        }
    });

function notificationCounter(key) {
    console.log('key inside function is: ' + key);
    admin.database().ref(`/users/${key}`).once('value').then(snapshot => {
        console.log(snapshot.val());
        const counter = snapshot.child('counter');
        console.log(counter.exists());
        if (!counter.exists()) {
            return counter.ref.set(1);
        } else {
            var counterValue = counter.val();
            console.log('counter value is: ' + counterValue);
            counterValue++;
            counter.ref.set(counterValue);
            var tokens = [snapshot.child('token').val()];
            console.log('token is: ' + tokens[0]);
        
            const payload = {
                notification: {
                    title: 'title',
                    body: 'body',
                }
            };
            return admin.messaging().sendToDevice(tokens, payload).then(response => {
                console.log(response.results);
            });
        }
    });
}
