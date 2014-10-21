(function () {
    execute = function () {
        /*Execute image Preview */
        $("#image_file").change(function () {
            readImage(this);
        });

        /*Try to open image for Preview */
        var readImage = function (input) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var html = '<img src="' + e.target.result + '">'
                    $('#img-preview').html(html);
                }

                reader.readAsDataURL(input.files[0]);
            }
        };

        /*Grab batches from API*/
        var batches = new captricity.api.Batches();
        batches.fetch({success: addBatchesToList});
        console.log(batches);

        var templates = new captricity.api.Documents();
        templates.fetch();
        console.log(templates);

        /*Iterate through batches and add to select drop down*/
        function addBatchesToList() {
            $("#loading").hide();
            var results = [
                {id: 0, text: "Create new Batch"}
            ];
            for (i = 0; i < batches.length; i++) {
                results.push({id: batches.at(i).get('name'), text: batches.at(i).get('name')});
            }

            $('#image_batch').val("Create new Batch").select2({
                placeholder: "Select a Batch",
                data: results,
                initSelection: function (element, callback) {
                    var data = {id: element.val(), text: element.val()};
                    callback(data);
                }
            });
        }

        function addTemplatesToList() {
            $("#loading").hide();
            var results = [];
            for (i = 0; i < templates.length; i++) {
                results.push({id: templates.at(i).get('id'), text: templates.at(i).get('name')});
            }

            $('#templates').select2({
                placeholder: "Select a Template",
                data: results,
                initSelection: function (element, callback) {
                    var data = {id: element.val(), text: element.val()};
                    callback(data);
                }
            });
        }

        create_batch_and_upload = function(){
            var title = $(this).parent().children('.title').html();
            /*Set Modal Title*/
            $('.modal-title').html("Choose Batch Name");

            /*Insert BatchName Input Fields*/
            var fields = '<div class="control-group file required image_batch">' +
                '<label class="required control-label"> Batch Name</label>' +
                '<div class="controls"><input id="name"></div></div>' +
                '<div class="control-group file required">' +
                '<label class="required control-label">Template</label>' +
                '<div class="controls"><input id="templates"></div></div>';

            $('.modal-body').html(fields);
            addTemplatesToList();

            /*Insert Submit Button*/
            var footer = '<input id="addBatchName" class="btn" name="commit" type="submit" value="Submit">';
            $('.modal-footer').html(footer);

            /*On submit function validate name and template and initiate batch create*/
            $('#addBatchName').click(function () {
                var batch_name = $("#name").val();
                var template_id = $("#templates").val();
                $('#image_batch').select2('data', {id: batch_name, text: batch_name});
                var name_used = false;
                for (i = 0; i < batches.length; i++) {
                    if (batch_name === batches.at(i).get('name')) {
                        alert("Batch name already taken. Choose another name or exit popup and select batch from list.")
                        name_used = true;
                        break;
                    }
                }
                if (templates <= 0) {
                    alert("Please select template for batch.")
                }
                if (!name_used) {
                    var batch_id = 0;
                    var new_batch = batches.create({name: batch_name}, {
                        success: function () {
                            if (template_id > 0) {
                                new_batch.save({documents: [template_id]})
                            }
                            var file = new captricity.api.BatchFiles();
                            file.batch_id = new_batch.get('id');
                            var uploader = new captricity.MultipartUploader({'uploaded_file': this.files[0]}
                                , _.bind(function (f, percent) {
                                    if (percent > 99) {
                                        file.fetch({success: function () {
                                            $("#new_image").submit();
                                        }});
                                    }
                                }, this), file.url());
                        }});
                }
            });

            $('#myModal').modal({show: true});
        };

        load_batch_and_upload = function(){
            $("#uploader").show();
            batches.fetch();
            var batch_id = 0;
            for (i = 0; i < batches.length; i++) {
                if (batches.at(i).get('name') === $("#image_batch").val()) {
                    batch_id = batches.at(i).get('id');
                    break;
                }
            }
            var file = new captricity.api.BatchFiles();
            var file_already_exisits = false;
            file.batch_id = batch_id;
            file.fetch({success: function () {
                for (i = 0; i < file.length; i++) {
                    if (file.at(i).get('file_name') === $("#image_file").prop('files')[0].name) {
                        file_already_exisits = true;
                        break;
                    }
                }
                if (!file_already_exisits) {
                    var uploader = new captricity.MultipartUploader({'uploaded_file': $("#image_file").prop('files')[0]}
                        , _.bind(function (f, percent) {
                            if (percent > 99) {
                                file.fetch({success: function () {
                                    $("#new_image").submit();
                                }});
                            }
                        }, this), file.url());
                }
                else {
                    alert("File already uploaded to this batch. Choose another file.")
                    $("#uploader").hide();
                }
            }});
        };



        /*When form is submited check for new batch and load modal to choose name*/
        $('.my-submit').click(function () {
            if ($("#image_batch").select2('data').text === "Create new Batch") {
                create_batch_and_upload();
                return false;
            } else {
                load_batch_and_upload();
                return false;
            }
        });

    };

    loadBatches = function () {
        $("#loading").show()
        waitForConnection();
        function waitForConnection() {
            $(".images.new").ready(function () {
                if (typeof captricity.api !== "undefined") {
                    execute();
                }
                else {
                    setTimeout(function () {
                        waitForConnection();
                    }, 100);
                }
            });
        };
    };

    $(document).ready(loadBatches);
    $(document).on('page:load', loadBatches);

    $(window).ajaxError(function (evt, jqXHR, settings, thrown) {
        alert('There was a problem with a request to url: ' + settings.url);
    });


}());
