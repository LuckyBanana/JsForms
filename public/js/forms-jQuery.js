/***********/
/** TODO **/
/*********/
/*  > MODIFY OBJECT ORDER
 *  > MODIFY COLUMN : FORM OK, VERIFIER LE POST SERVEUR
 *  > DELETE COLUMN (VOIR FAVORI ALTER DROP COLUMN)
 *  > BUTTON TO CLEAR FORM
 *  >
 *  >
 *  > GENERATE BUTTON ON NULL GENERATED FIELDS : NE FONCTIONNE PAS ENCORE POUR LES DATES (NOW)
 *  > CHOIX D'UNE ICONE LORS DE LA CREATION D'UNE VUE
 *  > DATA VALIDATION (FONCTIONS A LA FIN) --> VALIDATION SERVEUR ?
 *  >
 *  >
 *  >
 *  > POST MODIFY : CONSERVER SI UNE DATE EST DEJA SAISIE
 *  >
 *  > BOOTSTRAP JS COMPLIENCE
 *  > CLEAN AND ORDER CODE
 *  > BUG D'AFFICHAGE DES SELECT SUR LE MODAL D'AJOUT DE COLONNE - PAS EN 1080p ?
 *  >
 *  > Plus de contrôle sur la création modification de champs, type auto si foreign par ex.
 *  > Focus sur les champs à sasir
 *  > Effacer les champs apres la validation ou par bouton
 *  > Réorganisation des boutons sur une vue
 *  > Limite de taille du champ des boutons action
 *  >
 *  > Order view : reset button !
 *  >
 *  > Fonction INIT !!
 *  >
 *  > Custom view init : cocher case url automatique si text dans le input, décocher si input vide.
 *  >
 *  > Menu : Vue par défault n'est pas active au départ.
 *  > Gérer les erreurs dans les retours de l'api
 *  >
 *  >
 *  >
**/

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
**/

/*************/
/** GLOBAL **/
/***********/
viewObjects = {};
viewPages = {};
init();

function init() {
    $.get('/init', function (data) {
        console.log(data);
        if(data.msg === 'OK') {
            viewObjects = data.obj;
            for (key in viewObjects) {
                viewPages[key] = 1;
                refreshView(key);
            }
            // Cette merde ne fonctionne pas...
            $.get('/api/maintenance/admin', function (data) {
                initAdministrationView();
            });
            $.get('/api/maintenance/dev', function (data) {
                initColumnView();
                initEditColumn();
                initDevelopementView();
            });
        }
        else {
            dialogError('Error', data.obj);
        }
    });
}

function initColumnView() {

    $('#columnModal').on('show.bs.modal', function () {
        var objectLabel = viewObjects[getActiveObjectName()].label;
        $('#columnModalTitle').html('Add New Field To ' + objectLabel + ' View');
    });

    $('#columnDefaultInput').change( function () {
        if (this.checked) {
            $('#columnDefaultInput_val').prop('disabled', false);
        }
        else {
            $('#columnDefaultInput_val').prop('disabled', 'disabled');
        }
    });

    $('#columnForeignInput').change( function () {
        if (this.checked) {
            $('#referencedObjectInput_val').prop('disabled', false);
        }
        else {
            $('#referencedObjectInput_val').prop('disabled', 'disabled');
            $('#referencedFieldInput_val').prop('disabled', 'disabled');
        }
    });

    $.get('/api/maintenance/datatypes', function (data) {
        if(data.msg === 'OK') {
            var options = '';
            $.each(data.obj, function (index, value) {
                options += '<option>' + value + '</option>';
            });
            $('#columnTypeInput').append(options);
        }
    });

    $.get('/api/maintenance/datadefaults', function (data) {
        if(data.msg === 'OK') {
            var options = '';
            $.each(data.obj, function (index, value) {
                options += '<option>' + value + '</option>';
            });
            $('#columnDefaultInput_val').append(options);
        }
    });

    var foreignOptions = '';
    $.each(viewObjects, function (index, value) {
        foreignOptions += '<option value="' + value.name + '">' + value.label + '</option>';
    });
    $('#referencedObjectInput_val').append(foreignOptions);

    $('#referencedObjectInput_val').change(function () {
        if($(this).val() === '---') {
           $('#referencedFieldInput_val').html('<option>---</option>');
           $('#referencedFieldInput_val').prop('disabled', 'disabled');
        }
        else {
            $('#referencedFieldInput_val').html('');
            var objectName = $('option:selected', this).attr('value');
            var fields = viewObjects[objectName].fields;
            var options = '';
            $.each(fields, function (index, value) {
                if(['id', 'valid'].indexOf(value.name) === -1) {
                    options += '<option>' + value.label + '</option>';
                }
            });
            $('#referencedFieldInput_val').append(options);
            $('#referencedFieldInput_val').prop('disabled', false);
        }
    });

}

function addView() {
    for (type in viewObjects) {
        __hide(viewObjects[type].viewId);
    }
    __hide('__usersView');
    __hide('__administrationViews');
    __hide('__developmentViews');
    __show('__addView');
}

function cancelAddView() {
    __hide('__addView');
    __enable('navbar button');
    __clickable('__users_link');
    __show(getActiveView());
    for (type in viewObjects) {
        __clickable(viewObjects[type].name + '_link');
    }
}

function administrationView() {
    __hide(getActiveView());
    __hide('__usersView');
    __hide('__developmentViews');
    refreshUsers();
    __show('__administrationViews');
}

function developmentView() {
    __hide(getActiveView());
    __hide('__usersView');
    __hide('__administrationViews');
    refreshUsers();
    __show('__developmentViews');
}

function manageViewSubmit() {

}

function addColumn() {
    for (type in viewObjects) {
        __hide(viewObjects[type].viewId);
        __unclickable(viewObjects[type].name + '_link');
    }
    __show('column_view');
    __disable('navbar button');
}

function columnViewSubmit() {
    var validForm = true;
    var formData = {};
    $('#columnModal form div input').each( function (key, value) {
        var inputId = $(this).attr('id');
        if ($(this).attr('type') === 'text') {
            clearInput(inputId);
            if(this.value === '') {
                errorInput(inputId);
                validForm = false;
            }
            else {
                formData[inputId] = value.value;
            }
        }
        else if ($(this).attr('type') === 'checkbox') {
            clearCheckbox(inputId);
            formData[inputId] = (value.checked ? 1 : 0);
            if(value.checked === true) {
                var selectValue = $('#' + inputId + '_val').val();
                if(selectValue === '---') {
                    //console.log(inputId);
                    validForm = false;
                    errorCheckbox(inputId);
                }
                else {
                    formData[inputId + '_val'] = $('#' + inputId + '_val').val()
                }
            }
        }
    });

    $('#columnModal form div select').each( function (key, value) {
        var inputId = $(this).attr('id');
        formData[inputId] = value.value === '---' ? null : value.value;
    });

    formData.objectName = getActiveObjectName();

    console.log(formData);

    if(!validForm) return;

    $.post('/api/maintenance/addcolumn', formData, function (data) {
        if (data.msg === 'OK') {
            refreshActiveView();
        }
        else {
            alertError(data.obj);
        }
    });
}

function cancelColumnView() {
    __hide('column_view');
    __enable('navbar button');
    __show(getActiveView());
    for (type in viewObjects) {
        __clickable(viewObjects[type].name + '_link');
    }
}

function setDefault() {
    var object;
    for (obj in viewObjects) {
        if ($('#' + viewObjects[obj].viewId).hasClass('visible')) {
            object = viewObjects[obj];
        }
    }
    $.post('/api/maintenance/setdefault', {name: object.name}, function (data) {
        if (data.msg === 'OK') {
            location.reload();
        }
        else {
            alertError('Error while setting default view.');
        }
    })
}

function initAdministrationView() {
    var div = '<div id="__administrationViews" class="col-lg-12 main hidden">';
    div += '<h1 class="page-header">Manage Views</h1>';
    div += '<div class="row">';
    div += '<div id="adminview_messages" class="col-xs-12"></div>';
    div += '</div>';
    div += '<div>';
    div += '<ul class="nav nav-tabs" role="tablist">';
    div += '<li role="presentation" class="active"><a href="#evOrdreTab" aria-controls="home" role="tab" data-toggle="tab">Order views</a></li>';
    //div += '<li role="presentation"><a href="#evGroupTab" aria-controls="messages" role="tab" data-toggle="tab">Group views</a></li>';
    div += '</ul>';

    div += '<div class="tab-content">';
    //Create view panel
    //Order view panel
    div += '<div role="tabpanel" class="tab-pane active" id="evOrdreTab">' + initOrderViewsPanel() + '</div>';
    //Group view panel
    //div += '<div role="tabpanel" class="tab-pane" id="evGroupTab">' + initGroupViewsPanel() + '</div>';

    div += '</div>';
    div += '</div>';
    div += '</div>';

    $('#main').append(div);

    /*
    $('#groupViewInput').change( function () {
        if (this.checked) {
            $('#groupViewInput_val').prop('disabled', false);
        }
        else {
            $('#groupViewInput_val').prop('disabled', 'disabled');
        }
    });


    var options = '';
    $.get('/api/maintenance/groups', function (data) {
        $.each(data, function (index, value) {
            options += '<option>' + value.name + '</option>';
        });
        $('#groupViewInput_val').append(options);
    });
    //*/
    //$('#editColumnsOrder').append(editColumnsOrderDiv);
    $('#viewOrderSelect').dragOptions({highlight: '-> '});
}

function initDevelopementView() {
    //var div = '<div id="__developmentViews" class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main hidden">';
    var div = '<div id="__developmentViews" class="col-lg-12 hidden">';
    div += '<h1 class="page-header">Manage Views</h1>';
    div += '<div class="row">';
    div += '<div id="devview_messages" class="col-xs-12"></div>';
    div += '</div>';
    div += '<div>';
    div += '<ul class="nav nav-tabs" role="tablist">';
    div += '<li role="presentation" class="active"><a href="#evDataTab" aria-controls="home" role="tab" data-toggle="tab">Create view</a></li>';
    div += '</ul>';

    div += '<div class="tab-content">';
    //Create view panel
    div += '<div role="tabpanel" class="tab-pane active" id="evDataTab">' + initCreateViewPanel() + '</div>';

    div += '</div>';
    div += '</div>';
    div += '</div>';

    $('#main').append(div);

    $('#customInput').change(function () {
        if (this.checked) {
            $('#customValuesDiv').prop('hidden', false);
        }
        else {
            $('#customValuesDiv').prop('hidden', 'hidden');
        }
    });
}

function initCreateViewPanel() {
    var div = '<br><form>';
    div += '<div class="form-group">';
    div += '<label for="nameViewInput">View identifier</label>';
    div += '<input type="text" class="form-control" id="viewIdInput" placeholder="Identifier">';
    div += '</div>';
    div += '<div class="form-group">';
    div += '<label for="labeViewlInput">View pretty name</label>';
    div += '<input type="text" class="form-control" id="viewLabelInput" placeholder="Label">';
    div += '</div>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="groupViewInput"></span>';
    div += '<span class="input-group-addon">View Group</span>';
    div += '<select class="form-control form-inline" id="groupViewInput_val" value="Value" disabled><option>---</option></select>';
    div += '</div>';
    div += '<div class="checkbox">';
    div += '<label class="checkbox-inline"><input type="checkbox" id="defaultInput" value=""> Defaut View </label>';
    div += '<label class="checkbox-inline"><input type="checkbox" id="activableInput" value=""> Activable </label>';
    div += '</div>';

    div += '<div class="checkbox">';
    div += '<label class="checkbox-inline"><input type="checkbox" id="customInput" value=""> Custom View </label>';
    div += '</div>';

    div += '<div id="customValuesDiv" hidden>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="customGetInput"></span>';
    div += '<span class="input-group-addon">Get URL</span>';
    div += '<input type="text" class="form-control" id="customGetInput_val" placeholder="Get URL">';
    div += '</div>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="customPostInput"></span>';
    div += '<span class="input-group-addon">Post URL</span>';
    div += '<input type="text" class="form-control" id="customPostInput_val" placeholder="Post URL">';
    div += '</div>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="customUpdateInput"></span>';
    div += '<span class="input-group-addon">Update URL</span>';
    div += '<input type="text" class="form-control" id="customUpdateInput_val" placeholder="Update URL">';
    div += '</div>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="customDeleteInput"></span>';
    div += '<span class="input-group-addon">Delete URL</span>';
    div += '<input type="text" class="form-control" id="customDeleteInput_val" placeholder="Delete URL">';
    div += '</div>';
    div += '</div>';
    div += '';

    div += '</div>';
    div += '<div class="form-group">';
    div += '<div class="pull-right">';
    div += '<div class="btn-group">';
    div += '<button id="createViewReset" class="btn btn-warning" type="button">Reset</button>';
    div += '<button onclick="createViewSubmit()" class="btn btn-info" type="button">Create</button>';
    div += '</div>';
    div += '</div>';
    div += '</div>';
    div += '</form>';

    return div;
}

function initOrderViewsPanel() {
    var div = '<br><select multiple class="form-control" id="viewOrderSelect" size="';
    div += fieldCount(viewObjects) + '">';
    $.each(viewObjects, function (index, value) {
        div += '<option value="' + value.name + '">' + value.label + '</option>';
    });
    div += '</select>';
    div += '<form>';
    div += '<div class="form-group">';
    div += '<div class="pull-right">';
    div += '<div class="btn-group">';
    div += '<button id="orderViewReset" class="btn btn-warning" type="button">Reset</button>';
    div += '<button onclick="viewOrderSubmit()" class="btn btn-info" type="button">Submit</button>';
    div += '</div>';
    div += '</div>';
    div += '</div>';
    div += '</form>';

    return div;
}

function initGroupViewsPanel() {
    var div = '';

    return div;
}

function createViewSubmit() {

    var validForm = true;
    var formData = {};
    var custom = false;
    $('#evDataTab input').each( function (key, value) {

        if ($(this).parent().parent().attr('id') === 'customValuesDiv') return true;

        if ($(this).attr('type') === 'text') {
            clearInput($(this).attr('id'));
            if (value.value === '') {
                console.log($(this).attr('id'));
                errorInput($(this).attr('id'));
                validForm = false;
            }
            else {
                formData[$(this).attr('id')] = value.value;
            }

        }
        else if ($(this).attr('type') === 'checkbox') {
            formData[$(this).attr('id')] = (value.checked ? 1 : 0);
        }
    });

    clearInput('groupViewInput_val');
    if (formData['groupViewInput'] === 1) {
        var groupValue = $('#groupViewInput_val').val();
        if (groupValue === '---') {
            errorInput('groupViewInput_val');
            validForm = false
        }
        else {
            formData['groupViewInput_val'] = groupValue;
        }
    }
    else {
        formData['groupViewInput_val'] = '';
    }

    if (formData['customInput'] === 1) {
        $('#customValuesDiv input[type=checkbox]').each(function (key, value) {
            clearInput($(this).attr('id') + '_val');
            formData[$(this).attr('id')] = (value.checked ? 1 : 0);
            if (value.checked) {
                if ($('#' + $(this).attr('id') + '_val').val() === '') {
                    errorInput($(this).attr('id') + '_val');
                    validForm = false;
                }
                else {
                    formData[$(this).attr('id') + '_val'] = $('#' + $(this).attr('id') + '_val').val();
                }
            }
        });
    }

    if (!validForm) return;

    $.post('/api/maintenance/addview', formData, function (data) {
        if (data.msg === 'OK') {
            // TODO : Pas très beau
            // Vider le formulaire, Débloquer le menu, Afficher la vue précédente, Recharger la configuration, Rafraichir les vues.
            console.log(data);
            window.location.reload(true);
        }
        else if (data.msg === 'WAR') {
            for (inputId in data.obj) {
                clearInput(inputId + 'ViewInput');
                if (data.obj[inputId]) {
                    errorInput(inputId, 'This value is already used by another object.');
                }
            }
        }
        else {
            alertError(data.obj, 'devview');
        }
    });
}

function viewOrderSubmit() {

    var formData = {};

    $('#viewOrderSelect option').each( function (index, value) {
        formData[$(this).attr('value')] = index + 1;
    });

    $.post('/api/maintenance/object/order', formData, function (data) {
        if(data.msg === 'OK') {
            location.reload();
        }
        else {
            alertError(data.obj, 'adminview');
        }
    });
}


function initManageGroups() {

}

function initEditColumn() {

    var div = '<div class="modal fade" id="editColumnsModal" tabindex="-1" role="dialog" aria-labelledby="EditColumns">'
    div += '<div class="modal-dialog" role="document">'
    div += '<div class="modal-content">';
    div += '<div class="modal-header">';
    div += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
    div += '<h4 class="modal-title" id="editColumnsModalTitle">Modal title</h4>';
    div += '</div>';
    div += '<div id="editColumnsModalBody" class="modal-body">';
    div += '<ul class="nav nav-tabs" role="tablist">';
    div += '<li role="presentation" value="data" class="active"><a href="#editColumnsData" aria-controls="editColumnsData" role="tab" data-toggle="tab">Data</a></li>';
    div += '<li role="presentation" value="order"><a href="#editColumnsOrder" aria-controls="editColumnsOrder" role="tab" data-toggle="tab">Order</a></li>';
    div += '</ul>';
    div += '<div class="tab-content">';
    div += '<div role="tabpanel" class="tab-pane active" id="editColumnsData">';
    div += '<br><select class="form-control" id="editColumnsSelect"></select>';
    div += '</div>';
    div += '<div role="tabpanel" class="tab-pane" id="editColumnsOrder">';
    div += '</div>';
    div += '</div>';
    div += '</div>';
    div += '<div class="modal-footer">';
    div += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    div += '<button type="button" class="btn btn-primary" onclick="editColumnSubmit()" id="editColSaveBtn">Save changes</button>';
    //div += '<button type="button" class="btn btn-primary" id="editColSaveCloseBtn">Save changes and Close</button>';
    div += '</div>';
    div += '</div>';
    div += '</div>';
    div += '</div>';
    div += '</div>';

    $('#main').append(div);

    $('#editColumnsModal').on('show.bs.modal', function () {
        var object = viewObjects[getActiveObjectName()];
        $('#editColumnForm').remove();
        $('#editColumnsModalTitle').html('Edit ' + object.label + ' View Fields');
        $('#editColumnsSelect').html('<option>---</option>');
        $('#editColumnsOrder').html('');
        var editColumnsOrderDiv = '<br><select multiple class="form-control" id="columnOrderSelect" size="';
        editColumnsOrderDiv += fieldCount(object.fields) + '">';
        var initialRank = 1;
        $.each(object.fields, function (index, value) {
            if (value.name != 'id' && value.name != 'valid') {
                $('#editColumnsSelect').append('<option value="' + value.name + '">' + value.label + '</option>');
                editColumnsOrderDiv += '<option value="' + value.name + '">' + value.label + '</option>';
            }
        });
        editColumnsOrderDiv += '</select>';
        $('#editColumnsOrder').append(editColumnsOrderDiv);
        $('#columnOrderSelect').dragOptions({highlight: '-> '});

    });

    $('#editColumnsSelect').on('change', function () {
        var object = viewObjects[getActiveObjectName()];
        var field = object.fields[$(this).val()];
        editColumnForm(field);
    });

    $('#editColumnsData').on('shown.bs.tab', function () {
        $('#editColSaveBtn').text = 'salut';
    });
    $('#editColumnsOrder').on('shown.bs.tab', function () {
        $('#editColSaveBtn').text = 'hallo';
    });

}

function editColumnForm(field) {

    $('#editColumnForm').remove();
    var div = '<form id="editColumnForm" class="">';
    div += '<div class="form-group">';
    div += '<label for="columnLabelInput">Column pretty name</label>';
    div += '<input type="text" class="form-control" id="columnLabelEdit" placeholder="Label" value="' + field.label + '">';
    div += '</div>';
    div += '<div class="form-group">';
    div += '<label for="columnTypeInput">Column type</label>';
    div += '<select class="form-control" id="columnTypeEdit"></select>';
    div += '</div>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="columnDefaultEdit" ' + (field.generated === 1 ? 'checked' : '') + '></span>';
    div += '<span class="input-group-addon">Generated Field</span>';
    div += '<select class="form-control form-inline" id="columnDefaultEdit_val" value="Value" ' + (field.generated === 0 ? 'disabled' : '') + '><option>---</option></select>';
    div += '</div>';
    div += '<div class="input-group">';
    div += '<span class="input-group-addon">';
    div += '<input type="checkbox" id="columnForeignEdit"' + (field.foreign === 1 ? 'checked' : '') + '></span>';
    div += '<span class="input-group-addon">Foreign Field</span>';
    div += '<select class="form-control form-inline" id="referencedObjectEdit_val" value="Value" ' + (field.foreign === 0 ? 'disabled' : '') + '><option>---</option></select>';
    div += '<select class="form-control form-inline" id="referencedFieldEdit_val" value="Value" ' + (field.foreign === 0 ? 'disabled' : '') + '><option>---</option></select>';
    div += '</div>';
    div += '<br>';
    div += '<input type="checkbox" id="columnRemove">';
    div += '<label for="columnRemove">&nbspRemove Column</label>';
    div += '</form>';

    $('#editColumnsData').append(div);

    $('#columnDefaultEdit').change(function () {
        if (this.checked) {
            $('#columnDefaultEdit_val').prop('disabled', false);
        }
        else {
            $('#columnDefaultEdit_val').prop('disabled', 'disabled');
        }
    });

    $('#columnForeignEdit').change( function () {
        if (this.checked) {
            $('#referencedObjectEdit_val').prop('disabled', false);
        }
        else {
            $('#referencedObjectEdit_val').prop('disabled', 'disabled');
            $('#referencedFieldEdit_val').prop('disabled', 'disabled');
        }
    });

    $.get('/api/maintenance/datatypes', function (data) {
        console.log(data);
        if(data.msg === 'OK') {
            var options = '';
            $.each(data.obj, function (index, value) {
                options += '<option ' + (field.type === value ? 'selected' : '') + '>' + value + '</option>';
            });
            $('#columnTypeEdit').append(options);
        }
        else {
            alertError(data.obj);
            $('#editColumnsModal').modal('hide');
            //dialogError('Unable to retreive data types', data.obj);
        }
    });

    $.get('/api/maintenance/datadefaults', function (data) {
        if(data.msg === 'OK') {
            var options = '';
            $.each(data.obj, function (index, value) {
                options += '<option ' + (field.generated === 1 && field.default === value ? 'selected' : '') + '>' + value + '</option>';
            });
            $('#columnDefaultEdit_val').append(options);
        }
        else {
            //dialogError('Unable to retreive data defaults', data.obj);
            alertError(data.obj);
            $('#editColumnsModal').modal('hide');
        }
    });

    $.each(viewObjects, function (index, value) {
        var foreignOptions = '<option value="' + value.name + '"' + (field.foreign === 1 && field.referencedObject === value.name ? ' selected' : '') + '>' + value.label + '</option>';
        $('#referencedObjectEdit_val').append(foreignOptions);
    });

    if (field.foreign === 1) {
        //var fieldOptions = '';
        $.each(viewObjects[field.referencedObject].fields, function (index, value) {
            var fieldOptions = '<option value="' + value.name + '"' + (field.referencedField === value.name ? 'selected' : '') + '>' + value.label + '</option>';
            $('#referencedFieldEdit_val').append(fieldOptions);
        });
    }

    $('#referencedObjectEdit_val').change(function () {
        if($(this).val() === '---') {
           $('#referencedFieldEdit_val').html('<option>---</option>');
           $('#referencedFieldEdit_val').prop('disabled', 'disabled');
        }
        else {
            $('#referencedFieldEdit_val').html('');
            var objectName = $('option:selected', this).attr('value');
            var fields = viewObjects[objectName].fields;
            var options = '';
            $.each(fields, function (index, value) {
                if(['id', 'valid'].indexOf(value.name) === -1) {
                    options += '<option value="' + value.name + '">' + value.label + '</option>';
                }
            });
            $('#referencedFieldEdit_val').append(options);
            $('#referencedFieldEdit_val').prop('disabled', false);
        }
    });

}

function editColumnSubmit(close) {

    if ($('#columnRemove').is(':checked')) {
        columnRemoveSubmit();
        return;
    }

    var tabSubmit = {data: columnDataSubmit, order: columnOrderSubmit};
    var tabValue = $('#editColumnsModalBody li.active').attr('value');

    tabSubmit[tabValue]();
}


//TODO : Gestion des erreurs
function columnDataSubmit() {

    var objectName = getActiveObjectName();
    var columnName = $('#editColumnsSelect').val();
    var formData = {};

    $('#editColumnForm input').each( function (index, value) {

        if($(this).attr('type') === 'checkbox') {
            if(this.checked) {
                var checkboxId = $(this).attr('id');
                var checkValue = $('#' + checkboxId + '_val').val();
                if(checkValue === "---") {
                    //error select ? error checkbox
                }
                else {
                    formData[checkboxId] = 1;
                    if(checkboxId === 'columnForeignEdit') {
                        formData['referencedObjectEdit_val'] = $('#referencedObjectEdit_val').val();
                        formData['referencedFieldEdit_val'] = $('#referencedFieldEdit_val').val();
                    }
                    else {
                        formData[checkboxId + '_val'] = checkValue;
                    }
                }
            }
            else {
                formData[$(this).attr('id')] = 0;
            }
        }
        else {
            formData[$(this).attr('id')] = value.value;
        }
    });

    formData['columnTypeEdit'] = $('#columnTypeEdit').val();

    if (!columnFormValidation(formData).msg) {
        //SHOW ERROS
        return;
    }

    $.post('/api/maintenance/column/edit/' + objectName + '/' + columnName, formData, function (data) {
        if(data.msg === 'OK') {
            refreshActiveView();
        }
        else {
            alertError(data.obj);
            $('#editColumnsModal').modal('hide');
            //SHOW ERRORS
        }
    });

    if (close) {
        //DISMISS MODAL
    }
}

function columnOrderSubmit() {

    var formData = {};

    $('#columnOrderSelect option').each( function (index, value) {
        formData[$(this).attr('value')] = index + 1;
    });

    $.post('/api/maintenance/column/order/' + getActiveObjectName(), formData, function (data) {
        if(data.msg === 'OK') {
            refreshActiveView();
        }
        else {
            $('#editColumnsModal').modal('hide');
            alertError(data.obj);
        }
    });
}

//TODO : Gestion des erreurs
function columnRemoveSubmit() {
    var objectName = getActiveObjectName();
    var columnName = $('#editColumnsSelect').val();

    $.post('/api/maintenance/column/remove/' + objectName + '/' + columnName, function (data) {
        if(data.msg === 'OK') {
            //REFRESH
            //HIDE MODAL ?
            $('#editColumnsModal').modal('hide');
            refreshActiveView();
        }
        else {
            //ALERT ERROR
            $('#editColumnsModal').modal('hide');
            alertError(data.obj);
        }
    });

}

function removeView() {
    var object = viewObjects[getActiveObjectName()];
    var dismissButton = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>';
    var confirmButton = '<button type="button" class="btn btn-danger btn-sm" onclick="removeViewConfirm(\'' + object.name + '\')"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Yes</button>';
    var cancelButton = '<button type="button" data-dismiss="alert" class="btn btn-default btn-sm" onclick=""><span class="glyphicon glyphicon-remove" aria-hidden="true"></span> No</button>';
    var alertDiv = '<div class="alert alert-danger alert-dismissible fade in" role="alert">' + dismissButton +'<h4>Confirm Deletion</h4><p>Delete the ' + object.label + ' view ?</p>';
    alertDiv += '<p>' + confirmButton + cancelButton + '</div>';
    $('#' + object.name + '_messages').append(alertDiv);
}

function removeViewConfirm(name) {
    $.post('/api/maintenance/view/remove/' + name, function (data) {
        if(data.msg === 'OK') {
            location.reload(true);
        }
        else {
            alertError(data.obj);
        }
    });
}

//USERS

function initUsersView() {

    var div = '<div id="__usersView" class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main hidden">';
    div += '<div class="page-header" role="group">';
    div += '<div class="btn-group pull-right" role="group">';
    div += '<button class="btn btn-success" onclick="createUser()">Create User</button>';
    div += '</div>';
    div += '<h1 class="">Manage Users</h1>';
    div += '</div>';
    div += '<div class="row">';
    div += '<div id="__users_messages" class="col-xs-12"></div>';
    div += '</div>';
    div += '<div class="table">';
    div += '<table id="__users_table" class="table table-bordered">';
    div += '<thead>';
    div += '<tr>';
    div += '<th>Login</th>';
    div += '<th>Password</th>';
    div += '<th>Level</th>';
    div += '<th>Actions</th>';
    div += '</tr>';
    div += '</thead>';
    div += '<tbody></tbody>';
    div += '</table>';
    div += '</div>';
    div += '</div>';
    $('#main').append(div);

    div = '<div class="row">';
    div += '<div id="nav_users__" class="col-xs-12"></div>';
    div += '</div>';
}

function showUsers() {
    __hide(getActiveView());
    __hide('__developmentViews');
    __hide('__administrationViews');
    refreshUsers();
    __show('__usersView');
}

function refreshUsers() {
    $.get('/api/maintenance/users', function (data) {
      if(data.msg === 'OK') {
        $('#__usersView tbody').html('');
        var obj = data.obj;
        for (i in obj) {
            var c_row = '<tr id="__users_' + obj[i].id + '" class="' + (obj[i].active === 1 ? 'active' : '') + '">';
            c_row += '<td>' + obj[i].login + '</td>';
            c_row += '<td><span class="glyphicon glyphicon-asterisk" aria-hidden="true"></span></td>';
            c_row += '<td>' + obj[i].level + '</td>';
            c_row += '<td>' + userActions(obj[i].id, obj[i].active, true) + '</td>';
            $('#__usersView tbody').append(c_row);
        }
      }
      else {
        alertError(data.obj, '__users');
      }
    });
}

function userActions(id, active) {
    var label = 'Enable';
    if (active === 1) {
        label = 'Disable';
    }
    var bouton = '<div class="btn-group">';
    bouton += '<button id="__users_' + id + '_btn" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">';
    bouton += 'Action <span class="caret"></span>';
    bouton += '</button>';
    bouton += '<ul class="dropdown-menu">';
    bouton += '<li><a id="__users_m_' + id + '" onclick="modifyUser(' + id + ')" href="#">Modify</a></li>';
    bouton += '<li><a id="__users_a_' + id + '" onclick="activateUser(' + id + ')" href="#">' + label + '</a></li>';
    bouton += '<li><a id="__users_r_' + id + '" onclick="deleteUser(' + id + ')" href="#">Delete</a></li>';
    bouton += '</ul>'
    bouton += '</div>'

    return bouton;
}

function createUser() {
    var form = '<tr id="__usersForm"><form class="form-inline">';
    form += '<td><input type="text" class="form-control" id="userLoginInput" />';
    form += '<td><input type="password" class="form-control" id="userPasswordInput" />';
    form += '<td><select class="form-control" id="userLevelInput">';
    form += '<option>---</option>';
    form += '<option>0</option>';
    form += '<option>1</option>';
    form += '<option>2</option>';
    form += '<td><button class="btn btn-success" onclick="createUserSubmit()"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></button>';
    form += '<button class="btn btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true" onclick="dismiss(\'__usersForm\')"></span></button></td>';
    form += '</form></tr>';
    $('#__usersView table tbody').append(form);
}

function createUserSubmit() {

    $.getScript('/js/c.js', function () {

        var validForm = true;
        var params = {};
        $('#__usersForm td input').each( function (index, value) {
            clearInput($(this).attr('id'));
            if (value.value === '') {
                validForm = false;
                errorInput($(this).attr('id'));
            }
            else {
                if($(this).attr('id') === 'userPasswordInput') {
                    params[$(this).attr('id')] = CryptoJS.SHA256(value.value).toString(CryptoJS.enc.Base64);
                }
                else {
                    params[$(this).attr('id')] = value.value;
                }
            }
        });
        if ($('#userLevelInput').val() === '---') {
            validForm = false;
        }
        else {
            params['userLevelInput'] = $('#userLevelInput').val();
        }

        if (!validForm) return;

        $.post('/api/maintenance/users/create', params, function (data) {
            if(data && data.msg === 'OK') {
                refreshUsers();
            }
            else if (data.msg === 'WAR') {
                errorInput('userLoginInput', data.obj);
            }
            else {
                alertError('__users', data.obj);
            }
        });

    });
}

function modifyUser() {

}

function modifyUserSubmit() {

}

function deleteUser(id) {
    var confirmButton = '<button type="button" class="btn btn-danger btn-sm" onclick="deleteUserSubmit(' + id + ')"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Yes</button>';
    var cancelButton = '<button type="button" data-dismiss="alert" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span> No</button>';
    var alertDiv = '<div class="alert alert-danger fade-in" role="alert"><h4>Deletion</h4><p>Confirm deletion ?</p>' + '<p>' + confirmButton + cancelButton + '</p></div>';
    $('#__users_messages').append(alertDiv);
}

function deleteUserSubmit(id) {
    $.post('/api/maintenance/users/remove/' + id, function(data) {
        if (data.msg === 'OK') {
            $('#__users_' + id).remove();
            $('#__users_messages div').remove();
        } else {
            alertError(data.obj);
        }
    });
}

function activateUser(id) {
    $.post('/api/maintenance/users/activate/' + id, function (data) {
        if (data.msg === 'OK') {
            if ($('#__users_' + id).hasClass('active')) {
                $('#__users_' + id).removeClass('active');
                $('#__users_a_' + id).html('Enable');
            }
            else {
                $('#__users_' + id).addClass('active');
                $('#__users_a_' + id).html('Disable');
            }
        }
        else {
            //ALERT
            alertError(data.obj);
        }
    })
}

//** MENU **//
//ATTENTION PAS D'UNDERSCORE DANS LES VIEW ID
function menu(obj) {

    var view_link = $(obj).attr('id');
    var type = view_link.split('_')[0];
    var view_li = $('#' + view_link).parent();
    var object = viewObjects[type];
    var view = $('#' + object.viewId);

    if (view.hasClass('hidden')) {
        view_li.addClass('active');
        __show(object.viewId);
        $('div[id*=_view]').each(function() {
            if (this.id != object.viewId) {
                __hide(this.id);
            }
        });
        $('a[id*=_link]').each(function() {
            if (this.id != view_link) {
                $('#' + this.id).parent().removeClass('active');
            }
        });
    }

    __hide('__usersView');
    __hide('__administrationViews');
    __hide('__developmentViews');
}

function __hide(id) {
    $('#' + id).removeClass('visible');
    $('#' + id).addClass('hidden');
    $('#' + id).removeClass('active');
}

function __show(id) {
    $('#' + id).removeClass('hidden');
    $('#' + id).addClass('visible');
    $('#' + id).addClass('active');
}

function __clickable(id) {
    $('#' + id).removeClass('not-active');
}

function __unclickable(id) {
    $('#' + id).addClass('not-active');
}

function alertError(msg, obj) {
    var objectName = obj === undefined ? getActiveObjectName() : obj;
    var dismissButton = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">×</span></button>';
    var alertDiv = '<div class="alert alert-danger alert-dismissible fade in" role="alert">' + dismissButton +'<h4>Error</h4><p>' + msg + '</p></div>';
    $('#' + objectName + '_messages').append(alertDiv);
}

function dialogError(title, msg) {
    bootbox.dialog({title: title, message: msg, buttons : {"Dismiss": {className: "btn-danger"}}});
}

function __toggle(id, class1, class2) {
    if($('#' + id).hasClass(class2)) return;
    $('#' + id).toggleClass(class1 + ' '  + class2);
}

function __clear(id) {
    $('#' + id).val('');
}

/** FORM VALIDATION **/

function clearInput(id) {
    if($('#' + id).parent().hasClass('has-error')) {
        $('#' + id).parent().removeClass('has-error');
        $('#' + id).parent().removeClass('has-feedback');
        $('#' + id + '_errIcon').remove();
        $('#' + id + '_errMsg').remove();
    }
    return true;
}

function errorInput(id, msg) {
    $('#' + id).parent().addClass('has-error');
    $('#' + id).parent().addClass('has-feedback');
    var errSpan = '<span id="' + id + '_errIcon" class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>';
    $('#' + id).parent().append(errSpan);
    if(msg) {
        var errorLabel = '<label id= "' + id + '_errMsg" class="control-label" for="inputWarning1">' + msg + '</label>';
        $('#' + id).parent().append(errorLabel);
    }
    return true;
}

function clearCheckbox(id) {
    if($('#' + id).parent().parent().hasClass('has-error')) {
        $('#' + id).parent().parent().removeClass('has-error');
    }
    return true;
}

function errorCheckbox(id) {
    $('#' + id).parent().parent().addClass('has-error');
    return true;
}

function clearForm(id) {
    var formType = $('#' + id).attr('type')
    if(formType === 'text') {
        __clear(id);
    }
    else if (formType === 'checkbox') {
        $('#' + id).attr('checked', false);
        $('#' + id).parent().closest('div').find('select').each(
            function (index, value) {
                $('#' + this.id).prop('disabled', 'disabled');
                $('#' + this.id + ' option:contains(---)').prop('selected', true);
        });
    }
    else {
        // Type d'input non prévu..?
    }
}


function getActiveObjectName() {
    try {
        return viewObjects[$("#sidebar ul li[class='active'] a").attr('id').split('_')[0]].name;
    }
    //Cas où aucun objet n'a été créé.
    catch(err) {
        return '';
    }
}

function getActiveView() {
    try {
        return viewObjects[$("#sidebar ul li[class='active'] a").attr('id').split('_')[0]].viewId;
    }
    //Cas où aucun objet n'a été créé.
    catch(err) {
        return '';
    }
}

function getDefaultView() {
    for (type in viewObjects) {
        if(viewObjects[type].default === 1) {
            return viewObjects[type].viewId;
        }
    }
    return viewObjects[0].viewId;
}

/************/
/** VIEWS **/
/**********/

function refresh() {
    for (name in viewObjects) {
        if($('#' + viewObjects[name].viewId).hasClass('visible')) {
            navigationUpdate(name);
            refreshView(name);
            return;
        }
    }
}

function refreshView(key) {
    var object = viewObjects[key];
    var id = object.viewId;
    var url = object.apiUrl;
    var page = viewPages[key];
    if (object.custom === '1') {
        $.get(url, function (data) {
            $('#' + id + ' tbody').html('');
            for (i in data) {
                var c_row = '<tr id="' + object.name + '_' + data[i].id + '" class="' + (object.activable === "1" ?
                  (data[i].valid === "1" ? 'active' : '' ) : '') + '">';
                for (name in object.fields) {
                    if(name != 'id' && name != 'valid') {
                        c_row += '<td>' + data[i][name] + '</td>';
                    }
                }
                c_row += '<td>' + actionButton(data[i].id, object.name, object.alias, object.activable, data[i].valid) + '</td>';
                c_row += '</tr>';
                $('#' + id + ' table tbody').append(c_row);
            }
        });
    }
    else {
        $.get('/api/limit' + url + '/' + page, function(data) {
            if (data.msg === 'OK') {
                $('#' + id + ' tbody').html('');
                var obj = data.obj;
                for (i in obj) {
                    var c_row = '<tr id="' + object.name + '_' + obj[i].id + '" class="' + (object.activable === "1" ? (obj[i].valid === "1" ? 'active' : '' ) : '') + '">';
                    for (name in object.fields) {
                        if(name != 'id' && name != 'valid') {
                            c_row += '<td>' + obj[i][name] + '</td>';
                        }
                    }
                    c_row += '<td>' + actionButton(obj[i].id, object.name, object.alias, object.activable, obj[i].valid) + '</td>';
                    c_row += '</tr>';
                    $('#' + id + ' table tbody').append(c_row);
                }
            }
            else {
                alertError(data.obj)
            }
        });
        navigationUpdate(key);
    }
}

function refreshActiveView() {
    $.get('/init', function (data) {
        console.log(data);
        if (data.msg === 'OK') {
            viewObjects = data.obj;
            $('#' + getActiveView()).remove();
            initView(getActiveObjectName());
            refreshView(getActiveObjectName());
            __show(getActiveView());
        }
        else {
            dialogError(data.obj);
        }
    });
}

function actionButton(id, name, alias, activable, active) {
    var label = 'Enable';
    if (active === "1") {
        label = 'Disable';
    }
    var bouton = '<div class="btn-group">';
    bouton += '<button id="' + name + '_' + id + '_btn" type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">';
    bouton += 'Action <span class="caret"></span>';
    bouton += '</button>';
    bouton += '<ul class="dropdown-menu">';
    bouton += '<li><a id="' + alias + '_m_' + id + '" onclick="modify(' + id + ', \'' + name + '\')" href="#">Modify</a></li>';
    if (activable === "1") {
        bouton += '<li><a id="' + alias + '_a_' + id + '" onclick="activate(' + id + ', \'' + name + '\')" href="#">' + label + '</a></li>';
    }
    bouton += '<li><a id="' + alias + '_r_' + id + '" onclick="del(' + id + ', \'' + name + '\')" href="#">Delete</a></li>';
    bouton += '</ul>'
    bouton += '</div>'

    return bouton;
}

/**************/
/** ACTIONS **/
/************/

    // >>>>>>>>>>>>
    // >> CREATE <<
    // <<<<<<<<<<<<

function create() {
    var object;
    var excludedFields = ['id', 'valid'];
    for (obj in viewObjects) {
        if ($('#' + viewObjects[obj].viewId).hasClass('visible')) {
            object = viewObjects[obj];
        }
    }
    var formId = object.name + '_form';
    if ($('#' + formId).length != 0) {
        return;
    }
    var form = '<tr id="' + formId + '">';
    var datePickerButtons = [];
    var fileInputs = [];
    var colSize = 12/fieldCount(object.fields);
    for (name in object.fields) {
        var field = object.fields[name];
        if (excludedFields.indexOf(field.name) === -1) {
            var inputId = object.name + '_' + field.name + '_input';
            form += '<td>';
            if(field.generated === 1) {
                form += '<span class="glyphicon glyphicon-asterisk" aria-hidden="true"></span>';
            }
            else if (field.type === 'Date') {
                form += '<button id="' + inputId + '" type="button" class="btn btn-default" data-toggle="modal" data-target="#' + inputId + 'Modal">';
                form += '<span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>';
                form += '</button>';
                datePickerButtons.push(inputId);
            }
            else if (field.foreign === '1') {
                form += '<select class="form-control" id="' + inputId +'"></select>';
                createOptions(inputId, field.referencedField, field.referencedObject);
            }
            else if (field.type === 'File') {
                form += '<input type="file" class="file form-control" name="upload" id="' + inputId + '">';
                form += '<div id="' + inputId + '_err" class="help-block"></div>';
                fileInputs.push(inputId);
            }
            else {
                form += '<input type="text" class="form-control" id="' + inputId + '"/>';
            }
            form += '</td>';
        }
    }
    form += '<td><button class="btn btn-success" onclick="createSubmit(\'' + object.name + '\')"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></button>';
    form += '<button class="btn btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true" onclick="dismiss(\'' + formId +'\')"></span></button></td>';
    form += '</tr>';

    $('#' + object.viewId + ' table tbody').prepend(form);

    for (i in datePickerButtons) {
        createDatePickerModal(datePickerButtons[i]);
    }

    for (i in fileInputs) {
        $('#' + fileInputs[i]).fileinput({
            showUpload: false,
            showPreview: false,
            allowedFileExtensions: ['zip', 'tar.gz', 'exe'],
            elErrorContainer: '#' + fileInputs[i] + '_err'
        });
    }
}

function createOptions(id, refField, refObject, selected) {
    var object = viewObjects[refObject];
    $.get('/api/get' + object.apiUrl, function (data) {
        for (i in data) {
            $('#' + id).append('<option' + (typeof selected != 'undefined' && data[i][refField] === selected ? ' selected' : '') +'>' + data[i][refField] + '</option>')
        }
    });
}

//TODO : Upload de fichiers.. Voir commentaires.
function createSubmit(type) {
    var object = viewObjects[type];
    var validForm = true;
    var params = new FormData($('#' + object.name + '_form'));

    $('#' + object.name + '_form td input').each( function (index, value) {
        if (value.value === '') {
            validForm = false;
            errorInput($(this).attr('id'));
        }
    });

    if (!validForm) return;

    var params = {};
    //var params = new FormData($('#' + object.name + '_form'));

    //*
    for (name in object.fields) {
        var field = object.fields[name];
        if(field.generated === 0) {
            var inputId = object.name + '_' + field.name + '_input';
            params[field.name] = $('#' + inputId).val();
        }
    }
    //*/

    //var reader = new FileReader();

    /*
    for (name in object.fields) {
        var field = object.fields[name];
        if(field.generated === 0) {
            var inputId = object.name + '_' + field.name + '_input';
            if (field.type === 'File') {
                params.append(field.name, readAsDataURL$('#' + inputId).prop('files')[0]);
            }
            else {
                params.append(field.name, $('#' + inputId).val());
            }
        }
    }
    //*/

    //*
    $.post('/api/create' + object.apiUrl, params, function (data) {
        if(data && data.msg === 'OK') {
            refreshView(type);
        }
    });
    //*/

    /*
    $.ajax({
        type: 'POST',
        url: '/api/create' + object.apiUrl,
        data: params,
        processData: false,
        contentType: false,
        success: refreshView(type)
    });
    */
}

function dismiss(id) {
    $('#' + id).remove();
}

    // >>>>>>>>>>>>
    // >> MODIFY <<
    // <<<<<<<<<<<<

function modify(id, type) {
    var object = viewObjects[type];
    var fields = object.fields;
    var rowId = object.name + '_' + id;
    var index = 0;
    var datePickerButtons = [];

    for (name in fields) {
        var field = fields[name];
        if(name != 'id' && name != 'valid') {
            if (field.generated === 1) {
                if ($($('#' + rowId + ' td')[index - 1]).text() === "") {
                    var inputId = id + '_' + object.name + '_' + field.name + '_modify';
                    var input = '<div class="btn-group" data-toggle="buttons">';
                    input += '<label class="btn btn-default">';
                    input += '<input id="' + inputId +'" type="checkbox" autocomplete="off">';
                    input += '<span class="glyphicon glyphicon-edit" aria-hidden="true"></span> ';
                    input += '';
                    input += '</label>';
                    input += '</div>';

                    $($('#' + rowId + ' td')[index - 1]).html(input);
                    $('#' + inputId).change(function () {
                        if(this.checked) {
                            $(this).parent().toggleClass('btn-default btn-success');
                            $(this).next().toggleClass('glyphicon-plus glyphicon-check');
                        }
                        else {
                            $(this).parent().toggleClass('btn-success btn-default');
                            $(this).next().toggleClass('glyphicon-ok glyphicon-edit');
                        }
                    });
                }
            }
            else if (field.foreign === "1") {
                var inputId = id + '_' + object.name + '_' + field.name + '_modify';
                var input = '<select class="form-control" id="' + inputId + '"></select>';
                var selected = $($('#' + rowId + ' td')[index - 1]).text();
                $($('#' + rowId + ' td')[index - 1]).html(input);
                createOptions(inputId, field.referencedField, field.referencedObject, selected);
            }
            else if (field.type === 'Date') {
                var inputId = id + '_' + object.name + '_' + field.name + '_modify';
                var input = '<button id="' + inputId + '" type="button" class="btn btn-default" data-toggle="modal" data-target="#' + inputId + 'Modal">';
                input += '<span class="glyphicon glyphicon-calendar" aria-hidden="true"></span>';
                input += '</button>';
                input += ' ' + $($('#' + rowId + ' td')[index - 1]).text();
                $($('#' + rowId + ' td')[index - 1]).html(input);
                datePickerButtons.push(inputId);
            }
            else {
                var inputId = id + '_' + object.name + '_' + field.name + '_modify';
                var input = '<input type="text" class="form-control" id="' + inputId + '" value="' + $($('#' + rowId + ' td')[index - 1]).text() + '"/>';
                $($('#' + rowId + ' td')[index - 1]).html(input);
            }
        }
        index++;
    }
    var button = '<button class="btn btn-success" onclick="modifySubmit(' + id + ', \'' + type + '\')"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></button>';
    button += '<button class="btn btn-danger"><span class="glyphicon glyphicon-remove" aria-hidden="true" onclick="restoreModify(' + id + ', \'' + type + '\')"></span></button>';
    $('#' + rowId + ' td:last').html(button);

    for (i in datePickerButtons) {
        createDatePickerModal(datePickerButtons[i]);
    }
}


function modifySubmit(id, type) {
    var object = viewObjects[type];
    var params = {};
    $('#' + object.name + '_' + id + ' ').each(function (index, value) {
        if (value.value === '') {
            return;
        }
    });
    for (name in object.fields) {
        var field = object.fields[name];
        var inputId = id + '_' + object.name + '_' + field.name + '_modify';
        if (field.generated === 0) {
            params[field.name] = $('#' + inputId).val();
        }
        else {
            params[field.name] = $('#' + inputId).is(':checked') ? 1 : 0;
        }
    }
    $.post('/api/modify' + object.apiUrl + '/' + id, params, function (data) {
        if (data && data.msg === 'OK') {
            refreshView(type);
        }
    });
}

function restoreModify(id, type) {
    var object = viewObjects[type];
    $.get('/api/get' + object.apiUrl + '/' + id, function (data) {
        if (data != {}) {
            var c_row = '';
            for (name in object.fields) {
                if(name != 'id' && name != 'valid') {
                    c_row += '<td>' + data[name] + '</td>';
                }
            }
            c_row += '<td>' + actionButton(data.id, object.name, object.alias, object.activable, data.valid) +'</td>';
            $('#' + object.name + '_' + id).html(c_row);
        }
        else {
            alertError('Error while retrieving data.');
        }
    });
}

    // >>>>>>>>>>>>>>
    // >> ACTIVATE <<
    // <<<<<<<<<<<<<<

function activate(id, type) {
    var object = viewObjects[type];
    $.post('/api/activate' + object.apiUrl + '/' + id, function (data) {
        if (data === 'OK') {
            if ($('#' + type + '_' + id).hasClass('active')) {
                $('#' + type + '_' + id).removeClass('active');
                $('#' + object.alias + '_a_' + id).html('Enable');
            }
            else {
                $('#' + type + '_' + id).addClass('active');
                $('#' + object.alias + '_a_' + id).html('Disable');
            }
        }
        else {
            //ALERT
            alertError('Error while trying to activate entry.');
        }
    });
}

    // >>>>>>>>>>>>
    // >> DELETE <<
    // <<<<<<<<<<<<

function del(id, type) {
    var confirmButton = '<button type="button" class="btn btn-danger btn-sm" onclick="delConfirm(' + id + ', \'' + type + '\', 1)"><span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Yes</button>';
    var cancelButton = '<button type="button" data-dismiss="alert" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span> No</button>';
    var alertDiv = '<div class="alert alert-danger fade-in" role="alert"><h4>Deletion</h4><p>Confirm deletion ?</p>' + '<p>' + confirmButton + cancelButton + '</p></div>';
    $('#' + type + '_messages').append(alertDiv);
}

function delConfirm(id, type, action) {
    var object = viewObjects[type];
    if (action === 0) {
        $('#' + type + '_messages div').remove();
    } else if (action === 1) {
        $.post('/api/delete' +  object.apiUrl + '/' + id, function(data) {
            if (data === 'OK') {
                $('#' + type + '_' + id).remove();
                $('#' + type + '_messages div').remove();
            } else {
                alertError('Error while trying to delete entry.');
            }
        });
    }
}


/*****************/
/** NAVIGATION **/
/***************/

function navigationUpdate(type) {
    var object = viewObjects[type];
    var objectPage = viewPages[type];
    if(objectPage === 1) {
        __disable('prev_' + type + '_nav');
        __unclickable('prev_' + type + '_nav a');
    }
    else {
        __enable('prev_' + type + '_nav');
        __clickable('prev_' + type + '_nav a');
    }
    $.get('/api/count' + object.apiUrl, function (data) {
        if (data && data.count / objectPage < 20) {
            __disable('next_' + type + '_nav');
            __unclickable('next_' + type + '_nav a');
        } else {
            __enable('next_' + type + '_nav');
            __clickable('next_' + type + '_nav a');
        }
    });
    $('#page_' + type).text(objectPage);
}

function previous(type) {
    viewPages[type]--;
    navigationUpdate(type);
    refreshView(type);
}

function next(type) {
    viewPages[type]++;
    navigationUpdate(type);
    refreshView(type);
}

function __enable(id) {
    $('#' + id).removeClass('disabled');
}

function __disable(id) {
    $('#' + id).addClass('disabled');
}

/*****************/
/** DATEPICKER **/
/***************/

function createDatePickerModal(inputId) {

    var datePickerModal = '<div class="modal fade" id="' + inputId + 'Modal">';
    datePickerModal += '<div class="modal-dialog">';
    datePickerModal += '<div class="modal-content">';
    datePickerModal += '<div class="modal-header">';
    datePickerModal += '<button type="button" class="close" data-dismiss="modal" aria-label="Close">';
    datePickerModal += '<span aria-hidden="true">&times;</span></button>';
    datePickerModal += '<h4 class="modal-title">Pick a date and time</h4>';
    datePickerModal += '</div>';
    datePickerModal += '<div class="modal-body">';

    datePickerModal += '<div class="container">';
    datePickerModal += '<div class="form-group">';
    datePickerModal += '<div class="col-sm-6">';
    datePickerModal += '<div class="form-group">';
    datePickerModal += '<div class="input-group date" id="' + inputId + '_dp">';
    datePickerModal += '<input type="text" class="form-control" />';
    datePickerModal += '<span class="input-group-addon">';
    datePickerModal += '<span class="glyphicon glyphicon-calendar"></span>';
    datePickerModal += '</span>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';

    datePickerModal += '<div class="modal-footer">';
    datePickerModal += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
    datePickerModal += '<button type="button" class="btn btn-default" data-dismiss="modal" onclick="datePickerClear(\'' + inputId + '\')">Clear</button>';
    datePickerModal += '<button type="button" class="btn btn-primary" data-dismiss="modal" onclick="datePickerSubmit(\'' + inputId + '\')">Save changes</button>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';
    datePickerModal += '</div>';

    $('#main').append(datePickerModal);
    $('#' + inputId + '_dp').datetimepicker({
            widgetPositioning : {horizontal: 'right', vertical: 'bottom'},
            format: 'DD-MM-YYYY HH:mm',
            toolbarPlacement: 'top',
            showTodayButton: true,
            showClear: true,
        });
}

function datePickerSubmit(inputId) {
    var date = $('#' + inputId + '_dp input').val();
    if (date != '') {
        //Format date : 2015-09-25 18:22:42
        $('#' + inputId).attr('value', moment(date, 'DD-MM-YYYY HH:mm').format('YYYY-MM-DD HH:mm'));
        var div = $('#' + inputId).parent().html().split('</button>');
        $('#' + inputId).parent().html(div[0] + '</button> ' + date);
        __toggle(inputId, 'btn-default', 'btn-success');
    }
}

function datePickerClear(inputId) {
    __clear(inputId + '_dp input');
    $('#' + inputId).attr('value', '');
    __toggle(inputId, 'btn-success', 'btn-default');
}

/** AUTH **/

function logout() {
    $.get('/logout', function () {
        location.reload();
    });
}

/** DATA VALIDATION **/

function columnFormValidation(formData) {
    //Détermine si les choix de l'utilisateur sont compatibles.

    return {msg: true, detail: {}};
}

function viewFormValidation(formData) {
    //Détermine si les choix de l'utilisateur sont compatibles.

    return {msg: true, detail: {}};
}

/** JS **/

function fieldCount(fields) {
    var count = 0;
    var excludedFields = ['id', 'valid', 'activ'];
    for (key in fields) {
        if (excludedFields.indexOf(key) === -1) count++;
    }
    return count;
}
