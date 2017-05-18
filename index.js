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
        const user = snapshot.val();
        console.log("user:" + user);
        var counter = user.counter;
        console.log("original count: " + counter);
        counter++;
        console.log("added count: " + counter);
        snapshot.child('counter').ref.set(counter);
        var token = user.token;
        console.log("user token is:" + token);
        sendMessage(user, token);
    });

    function sendMessage(user, token) {
        var tokens = [token];
        const payload = {
            data: {
                "message": "Greetings from the app",
                "number": `${user.name} sent you a message`
            }
        };
        return admin.messaging().sendToDevice(tokens, payload).then(response => {
            console.log(response.results);
        });
    }
}
