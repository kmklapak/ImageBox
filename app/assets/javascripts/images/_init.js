(function() {
    captricity.endpointURL = 'https://shreddr.captricity.com/api/backbone/schema';
    captricity.apiToken = '3a49d79ceec94f599b2b2e2d4f0553bb';

    window.schema = new captricity.APISchema();

    function handleSchemaReady(){
        console.log("The schema has been fetched and used to populate captricity.api.*");
    }

    $(document).ready(function(){
        if(captricity.apiToken) {
            window.schema.fetch({success: handleSchemaReady });
        }

        $('#flash').delay(500).fadeIn('normal', function() {
            $(this).delay(2500).fadeOut();
        });
    });


}());