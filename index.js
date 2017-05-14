var functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.notificationCounter = functions.database.ref('/users/{childs}/notification')
    .onWrite(event => {
        var notification = event.data.val();
        console.log('notification update: ' + notification);
        if (notification) {
            const key = event.data.ref.parent.key;
            console.log('the key is:' + key);
            admin.database().ref(`/users/${key}`).once('value').then(snapshot => {
                console.log(snapshot.val());
                const counter = snapshot.child('counter');
                console.log(counter.exists());
                if (!counter.exists()) {
                    return counter.ref.set(1);
                } else {
                    var counterValue = counter.val();
                    console.log(counterValue);
                    counterValue++;
                    return counter.ref.set(counterValue)
                }
            });
        } else {
            return;
        }
    });
