/* eslint class-methods-use-this: */

/* portals.js
 *
 * Copyright 2020 Martin Abente Lahaye
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const {Gio, GObject} = imports.gi;

const PermissionsIface = `
<node xmlns:doc="http://www.freedesktop.org/dbus/1.0/doc.dtd">
    <interface name="org.freedesktop.impl.portal.PermissionStore">
        <method name="Lookup">
            <arg type="s" name="table" direction="in"/>
            <arg type="s" name="id" direction="in"/>
            <arg type="a{sas}" name="permissions" direction="out"/>
            <arg type="v" name="data" direction="out"/>
        </method>
        <method name="SetPermission">
            <arg type="s" name="table" direction="in"/>
            <arg type="b" name="create" direction="in"/>
            <arg type="s" name="id" direction="in"/>
            <arg type="s" name="app" direction="in"/>
            <arg type="as" name="permissions" direction="in"/>
        </method>
    </interface>
</node>
`;


var FlatpakPortalsModel = GObject.registerClass({
    GTypeName: 'FlatpakPortalsModel',
}, class FlatpakPortalsModel extends GObject.Object {
    _init() {
        super._init({});

        this.appId = '';
        const PermissionsProxy = Gio.DBusProxy.makeProxyWrapper(PermissionsIface);
        this._proxy = new PermissionsProxy(
            Gio.DBus.session,
            'org.freedesktop.impl.portal.PermissionStore',
            '/org/freedesktop/impl/portal/PermissionStore');
    }

    getPermissions() {
        return {
            background: {
                version: '0.4.0',
                description: _('Background'),
                value: this.constructor.getDefault(),
                example: _('Can run in the background'),
                table: 'background',
                id: 'background',
            },
            notification: {
                version: '0.4.0',
                description: _('Notification'),
                value: this.constructor.getDefault(),
                example: _('Can send notifications'),
                table: 'notifications',
                id: 'notification',
            },
            microphone: {
                version: '0.4.0',
                description: _('Microphone'),
                value: this.constructor.getDefault(),
                example: _('Can access your microphone'),
                table: 'devices',
                id: 'microphone',
            },
            speakers: {
                version: '0.4.0',
                description: _('Speakers'),
                value: this.constructor.getDefault(),
                example: _('Can access your speakers'),
                table: 'devices',
                id: 'speakers',
            },
            camera: {
                version: '0.4.0',
                description: _('Camera'),
                value: this.constructor.getDefault(),
                example: _('Can access your camera'),
                table: 'devices',
                id: 'camera',
            },
            location: {
                version: '0.4.0',
                description: _('Location'),
                value: this.constructor.getDefault(),
                example: _('Can access your location'),
                table: 'devices',
                id: 'location',
            },
        };
    }

    static getType() {
        return 'state';
    }

    static getDefault() {
        return false;
    }

    static getStyle() {
        return 'portals';
    }

    static getGroup() {
        return 'portals';
    }

    static getTitle() {
        return 'Portals';
    }

    static getDescription() {
        return _('Provide selective access to resources');
    }

    updateFromProxyProperty(property, value) {
        const permission = this.getPermissions()[property];
        const access = value ? ['yes'] : ['no'];
        this._proxy.SetPermissionSync(
            permission.table,
            true,
            permission.id,
            this.appId,
            access);
    }

    updateProxyProperty(proxy) {
        Object.entries(this.getPermissions()).forEach(([property, permission]) => {
            try {
                const [appIds] = this._proxy.LookupSync(permission.table, permission.id);
                const value = this.appId in appIds && appIds[this.appId][0] === 'yes';
                proxy.set_property(property, value);
            } catch (err) {
                proxy.set_property(property, false);
            }
        });
    }

    restore(toDefaults = false) {
        Object.entries(this.getPermissions()).forEach(([property, permission]) => {
            const value = toDefaults ? permission.value : this._backup[property];
            this.updateFromProxyProperty(property, value);
        });
    }

    backup(proxy) {
        this._backup = {};
        Object.keys(this.getPermissions()).forEach(property => {
            this._backup[property] = proxy[property];
        });
    }

    changed(proxy) {
        for (const property in this.getPermissions()) {
            if (proxy[property] === true)
                return true;
        }
        return false;
    }

    saveToKeyFile() {

        /* this backend has no file */
    }

    reset() {

        /* this backends speaks directly to DBus */
    }
});
