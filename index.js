var functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
//Be carefull here, I was trying to use functions.database to read other nodes, but it won't because it only read the listened node
//you hace to use admin to read other nodes basing upon the data you got with the listener


//So when the user register a node will be created with the user data, this node is later used to trigger the notification
//currently there is a bug where user.displayName returns undefined, this is a known issue with firebase
exports.registerUser = functions.auth.user().onCreate(event => {
    const user = event.data;
    /*WARNING
    Please be very carefull by passing programatic values, I was mistaken the `` for simple quotes for a long time
    WARNING*/
    return admin.database().ref('users').child(`${user.uid}`).set({
        name: `${user.displayName}`,
        counter: 0,
        email: `${user.email}`,
        notification: false
    });
});

//According to documentation, listening to nodes should be done as specific as it can be, so we should only listen to the notification node inside each user
//the curly brackets {} are used as a wild card, so all the notification node inside any user is being listen
//When the notification node is set to true the logic will start
exports.notificationListener = functions.database.ref('/users/{childs}/notification')
    .onWrite(event => {
        var notification = event.data.val();
        console.log('notification update: ' + notification);
        if (notification) {
            //A trade off between listening to every node inside user, and only the notification node inside every user, is that
            // we don't have the data. The trigger will only be activated in specific cases, but it we have to get the rest of the data from other nodes.
            //We can't get the data by using the parent, and then getting into the parent child, because the event only brings the data of the node we are listening
            //but we could set another node through the parent, somthing like event.ref.parent.child('otherNode').set('hello');
            const key = event.data.ref.parent.key;
            console.log('the key is:' + key);
            notificationCounter(key);
        } else {
            //I saw in some of the sample repos, that they always return, and the docs state that should always be return a promise
            //so, try to follow what I saw, and if it is false the notification, then the function ends with this retun
            return;
        }
    });

//Since we can get the uid from the node user, we can can query for the complete node, then we can get thoose values and run some small business logic
function notificationCounter(key) {
    admin.database().ref(`/users/${key}`).once('value').then(snapshot => {
        const user = snapshot.val();
        var counter = user.counter;
        counter++;
        //The business logic is simple, by getting the full user node, we can get the value of the notification counter, then we add ++ and set it to the same node
        snapshot.child('counter').ref.set(counter);
        //The token node should be set by the client, so you have to login from some where and send de FCM token
        var token = user.token;
        sendMessage(user, token);
    });
}

//This function will send the notification, in this case we are sending notification only with data, and the data is obtained by the user node that was gotten before
function sendMessage(user, token) {
    //In the samples the notification is send to an array of tokens, I try it with a single token as a String and it worked, but let's keep it as text book
    var tokens = [token];
    const payload = {
        data: {
            "message": "Greetings from the app",
            "sender": `${user.name} sent you a message`
        }
    };
    return admin.messaging().sendToDevice(tokens, payload).then(response => {
        //Let's keep this console log to see if the notification was actually set it
        console.log(response.results);
    });
}