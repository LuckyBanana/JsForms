/** NOT USED ANYMORE **/

/***********/
/** TODO **/
/*********/
/*  > MODIFY COLUMN ORDER, OBJECT ORDER
 *  > MODIFY, DELETE COLUMN
 *  > BUTTON TO CLEAR FORM
 *  > NAVIGATION BUTTONS BUG
 *  > BOOTSTRAP JS COMPLIENCE
 *  > GENERATE BUTTON ON NULL GENERATED FIELDS
 *  > CHOIX D'UNE ICONE LORS DE LA CREATION D'UNE VUE
 *  > CLEAN AND ORDER CODE
 *  > BUG RELOAD AFTER SET DEFAULT
**/

/*************/
/** GLOBAL **/   // SERVER SIDE
/***********/


/*
    Functions :

        initView
        initMenu
        initNavbar
        initAddView
        initEditColumn
        initColumnView
        initUsersView
*/

var FormsJs = { rev: '0.1' };

FormsJs.Forms = function () {

    this.initView = function (level) {

        var div = '';

        for (key in viewObjects) {
            var object = viewObjects[key];
            div += '<div id="' + object.viewId + '" class="col-lg-12 panel ' + (object.default == 1 ? 'visible' : 'hidden') + '">';
            // div += '<div id="' + object.viewId + '" class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main panel ' + (object.default == 1 ? 'visible' : 'hidden') + '">';

            div += '<div class="page-header" role="group">';
            div += '<div class="btn-group pull-right" role="group">';
            if (level > 0) {
                div += '<button class="btn btn-success" onclick="create()">New ' + object.label + '</button>';
            }
            if (level > 1) {
                div += '<button class="btn btn-default" onclick="setDefault()">Set as Default</button>';

            }
            if (level > 2) {
                div += '<button class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Colums <span class="caret"></span>';
                div += '</button>';
                div += '<ul class="dropdown-menu">';
                div += '<li><a href="#" data-toggle="modal" data-target="#columnModal">Add Column</a></li>';
                div += '<li><a href="#" data-toggle="modal" data-target="#editColumnsModal">Edit Columns</a></li>';
                div += '</ul>';
                div += '<button class="btn btn-danger" onclick="removeView()">Delete View</button>';
            }
            div += '</div>';
            div += '<h1 class="">' + object.label + '</h1>';
            div += '</div>';
            div += '<div class="row">';
            div += '<div id="' + key + '_messages" class="col-xs-12"></div>';
            div += '</div>';
            div += '<div class="table">';
            div += '<table id="' + key + '_table" class="table table-bordered">';
            div += '<thead>';
            div += '<tr>';

            for (name in object.fields) {
                if(name != 'id' && name != 'valid') {
                    div += '<th>' + object.fields[name].label + '</th>';
                }
            }
            if (level > 0) {
                div += '<th>Actions</th>';
            }
            div += '</tr>';
            div += '</thead>';
            div += '<tbody></tbody>';
            div += '</table>';
            div += '</div>';
            div += '</div>';
            //div += '<div class="row">';

            // var nav = '<nav class="pull-right" >';
            // nav += '  <ul class="pagination">';
            // nav += '    <li id="prev_' + object.name + '_nav">';
            // nav += '      <a aria-label="Previous" onclick="previous(\'' + object.name +'\')">';
            // nav += '        <span aria-hidden="true">&laquo;</span>';
            // nav += '      </a>';
            // nav += '    </li>';
            // nav += '    <li class="active"><a href="#" id="page_' + object.name + '">' + '' + '</a></li>';
            // nav += '    <li id="next_' + object.name + '_nav">';
            // nav += '      <a aria-label="Next"  onclick="next(\'' + object.name +'\')">';
            // nav += '        <span aria-hidden="true">&raquo;</span>';
            // nav += '      </a>';
            // nav += '    </li>';
            // nav += '  </ul>';
            // nav += '</nav>';


            // div += '<div id="nav_' + key + '" class="col-xs-12">' + nav + '</div>';
            // div += '</div>';
            // div += '</div>';
        }

        return div;
    }

    this.initMenu = function (level) {
        var active = 'active';
        //var ul = '<ul class="nav nav-sidebar">';
        var ul = '<div class="sidebar-nav navbar-collapse">';
        ul += '<ul class="nav">';
        for (key in viewObjects) {
            var object = viewObjects[key];
            ul += '<li class="' + (object.default == '1' ? 'active' : '') + '"><a id="' + key + '_link" href="#" onclick="menu(this)">' + object.label + '</a></li>'
            active = '';
        }

        if (level >= 2) {
            //ADMINISTRATION
            /*ul += '<li class="nav-divider"></li>';
            ul += '<li class="dropdown">';
            ul += '<a data-toggle="collapse" href="#maintenanceOptions">Maintenance <span class="caret"></span>';
            ul += '<span style="font-size:16px;" class="pull-right hidden-xs showopacity glyphicon glyphicon-cog"></span></a>';
            ul += '<div class="collapse" id="maintenanceOptions">';
            ul += '<a class="list-group-item" onclick="addView()">Create View <span class="pull-right hidden-xs showopacity glyphicon glyphicon-plus-sign" aria-hidden="true"></span></a>';
            //ul += '<a class="list-group-item" onclick="editView()">Edit View <span class="pull-right hidden-xs showopacity glyphicon glyphicon-edit" aria-hidden="true"></span></a>';
            ul += '<a class="list-group-item" onclick="showUsers()">Users <span class="pull-right hidden-xs showopacity glyphicon glyphicon-user" aria-hidden="true"></span></a>';
            ul += '</div>';
            ul += '</li>';
            //END   */
            ul += '<li class="nav-divider"></li>';
            ul += '<li class="dropdown">';
            ul += '<a data-toggle="collapse" href="#maintenanceOptions">Administration <span class="caret"></span>';
            ul += '<span style="font-size:16px;" class="pull-right hidden-xs showopacity glyphicon glyphicon-cog"></span></a>';
            ul += '<div class="collapse" id="maintenanceOptions">';
            //ul += '<a class="list-group-item" onclick="addView()">Create View <span class="pull-right hidden-xs showopacity glyphicon glyphicon-plus-sign" aria-hidden="true"></span></a>';
            ul += '<a class="list-group-item" onclick="administrationView()">Manage Views <span class="pull-right hidden-xs showopacity glyphicon glyphicon-edit" aria-hidden="true"></span></a>';
            //ul += '<a class="list-group-item" onclick="">Manage Groups <span class="pull-right hidden-xs showopacity glyphicon glyphicon-edit" aria-hidden="true"></span></a>';
            ul += '<a class="list-group-item" onclick="showUsers()" id="__users_link">Users <span class="pull-right hidden-xs showopacity glyphicon glyphicon-user" aria-hidden="true"></span></a>';
            ul += '</div>';
            ul += '</li>';
        }
        if (level == 99) {
            //DEV
            ul += '<li class="nav-divider"></li>';
            ul += '<li class="dropdown">';
            ul += '<a data-toggle="collapse" href="#developmentOptions">Development <span class="caret"></span>';
            ul += '<span style="font-size:16px;" class="pull-right hidden-xs showopacity glyphicon glyphicon-cog"></span></a>';
            ul += '<div class="collapse" id="developmentOptions">';
            //ul += '<a class="list-group-item" onclick="addView()">Create View <span class="pull-right hidden-xs showopacity glyphicon glyphicon-plus-sign" aria-hidden="true"></span></a>';
            ul += '<a class="list-group-item" onclick="developmentView()">Manage Views <span class="pull-right hidden-xs showopacity glyphicon glyphicon-edit" aria-hidden="true"></span></a>';
            //ul += '<a class="list-group-item" onclick="">Manage Groups <span class="pull-right hidden-xs showopacity glyphicon glyphicon-edit" aria-hidden="true"></span></a>';
            ul += '</div>';
            ul += '</li>';
        }
        ul += '</ul>';
        ul += '</div>';

        return ul;
    }

    this.initNavbar = function () {
        var div = '<div id="navbar" class="btn-group navbar-right" role="group">';
        div += '<button class="btn btn-info navbar-btn" onclick="refresh()"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span> Refresh</button>';
        div += '<button class="btn btn-default navbar-btn" onclick="logout()"><span class="glyphicon glyphicon-off" aria-hidden="true"></span> Logout</button>';
        div += '</div>';

        return div;
    }

    this.initAddView = function () {
        //var div = '<div id="__addView" class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main hidden">';
        var div = '<div id="__addView" class="col-lg-12 main hidden">';
        div += '<h1 class="page-header">Create View</h1>';
        div += '<div class="row">';
        div += '<div id="addview_messages" class="col-xs-4"></div>';
        div += '</div>';
        div += '<div>';
        div += '<form>';
        div += '<div class="form-group">';
        div += '<label for="nameViewInput">View identifier</label>';
        div += '<input type="text" class="form-control" id="viewIdInput" placeholder="Identifier">';
        div += '</div>';
        div += '<div class="form-group">';
        div += '<label for="labeViewlInput">View pretty name</label>';
        div += '<input type="text" class="form-control" id="viewLabelInput" placeholder="Label">';
        div += '</div>';
        div += '<div class="form-group">';
        div += '<label for="aliasViewlInput">View alias</label>';
        div += '<input type="text" class="form-control" id="viewAliasInput" placeholder="Alias">';
        div += '</div>';
        div += '<div class="form-group">';
        div += '<label for="apiUrlViewInput">Api Url</label>';
        div += '<input type="text" class="form-control" id="apiUrlInput" placeholder="Url">';
        div += '</div>';
        div += '<div class="checkbox">';
        div += '<label class="checkbox-inline"><input type="checkbox" id="defaultInput" value=""> Defaut View </label>';
        div += '<label class="checkbox-inline"><input type="checkbox" id="activableInput" value=""> Activable </label>';
        div += '</div>';
        div += '<div class="form-group">';
        div += '<div class="pull-right">';
        div += '<div class="btn-group">';
        div += '<button onclick="addViewSubmit()" class="btn btn-info" type="button">Create</button>';
        div += '<button id="cancelAddViewBtn" onclick="cancelAddView()" class="btn btn-warning" type="button" data-toggle="tooltip" data-placement="bottom" '
        div += 'title="Cancel this view to restore naivgation">Cancel</button>';
        div += '</div>';
        div += '</div>';
        div += '</div>';
        div += '</form>';
        div += '</div>';
        div += '</div>';

        return div;
    }

    this.initEditColumn = function () {
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
        div += '</div>';
        div += '</div>';
        div += '</div>';
        div += '</div>';
        div += '</div>';

        return div;
    }

    this.initColumnView = function () {
        var div = '<div class="modal fade" id="columnModal" tabindex="-1" role="dialog" aria-labelledby="AddNewField">';
        div += '<div class="modal-dialog" role="document">';
        div += '<div class="modal-content">';
        div += '<div class="modal-header">';
        div += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
        div += '<h4 id="columnModalTitle">Add new field</h4>';
        div += '</div>';
        div += '<div class="modal-body">';
        div += '<form class="">';
        div += '<div class="form-group">';
        div += '<label for="columnIdInput">Column identifier</label>';
        div += '<input type="text" class="form-control" id="columnIdInput" placeholder="Identifier">';
        div += '</div>';
        div += '<div class="form-group">';
        div += '<label for="columnLabelInput">Column pretty name</label>';
        div += '<input type="text" class="form-control" id="columnLabelInput" placeholder="Label">';
        div += '</div>';
        div += '<div class="form-group">';
        div += '<label for="columnTypeInput">Column type</label>';
        div += '<select class="form-control" id="columnTypeInput"></select>';
        div += '</div>';
        div += '<div class="input-group">';
        div += '<span class="input-group-addon">';
        div += '<input type="checkbox" id="columnDefaultInput"></span>';
        div += '<span class="input-group-addon">Generated Field</span>';
        div += '<select class="form-control form-inline" id="columnDefaultInput_val" disabled value="Value"><option>---</option></select>';
        div += '</div>';
        div += '<div class="input-group">';
        div += '<span class="input-group-addon">';
        div += '<input type="checkbox" id="columnForeignInput"></span>';
        div += '<span class="input-group-addon">Foreign Field</span>';
        div += '<select class="form-control form-inline" id="referencedObjectInput_val" disabled value="Value"><option>---</option></select>';
        div += '<select class="form-control form-inline" id="referencedFieldInput_val" disabled value="Value"><option>---</option></select>';
        div += '</div></form>';
        div += '<div class="modal-footer">';
        div += '<button onclick="columnViewSubmit()" class="btn btn-primary" type="button">Create</button>';
        div += '<button class="btn btn-default" type="button" data-dismiss="modal">Close</button>';
        div += '</div></div></div></div>';

        return div;
    }

    this.initUsersView = function () {
        //var div = '<div id="__usersView" class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main hidden">';
        var div = '<div id="__usersView" class="col-lg-12 main hidden">';
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
        //div += '<th></th>';
        div += '<th>Actions</th>';
        div += '</tr>';
        div += '</thead>';
        div += '<tbody></tbody>';
        div += '</table>';
        div += '</div>';
        div += '</div>';

        return div;
    }
}

module.exports = FormsJs;
