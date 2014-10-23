(function() {
    user = function () {
        var user = new captricity.api.UserProfile();
        user.bind('change', printUserProfile);
        user.fetch();

        function printUserProfile(userProfile, response) {
            var usernameDivEl = $('#user-id');
            usernameDivEl.html('Signed in to Captricity as : <span id=\'user-username\'>' + userProfile.get('username') + '</span>');

        }
    };

    var loadUserProfile = function () {
        waitForConnection();
        function waitForConnection() {
            $(".registrations.edit").ready(function () {
                if (typeof captricity.api !== "undefined") {
                    user();
                }
                else {
                    setTimeout(function () {
                        waitForConnection();
                    }, 100);
                }
            });
        };
    };

    $(document).ready(loadUserProfile);
    $(document).on('page:load', loadUserProfile);


}());