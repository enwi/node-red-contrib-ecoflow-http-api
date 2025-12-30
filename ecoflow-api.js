module.exports = function(RED) {
    
    function RemoteServerNode(n) {
        RED.nodes.createNode(this,n);

        let node = this;

        let ecoflowApiServer = n.server;
        let accessKey = node.credentials.access_key;
        let secretKey = node.credentials.secret_key;

        const ecoflow = require("@ecoflow-api/rest-client");

        const client = new ecoflow.RestClient({
            accessKey: accessKey,
            secretKey: secretKey,
            host: ecoflowApiServer,
        });

        const mainSnEndpoint = "/iot-open/sign/device/system/main/sn";

        node.resolveMainSn = async (sn) => {
            if (!sn) {
                return sn;
            }

            try {
                const response = await client.requestHandler.get(`${mainSnEndpoint}?sn=${encodeURIComponent(sn)}`);
                const resolvedSn = response?.data?.mainSn || response?.data?.sn || response?.data;

                if (typeof resolvedSn === "string" && resolvedSn.length > 0) {
                    return resolvedSn;
                }

                return sn;
            } catch (error) {
                node.debug(`main SN lookup failed for ${sn}: ${error.message}`);
                return sn;
            }
        };

        node.queryQuotaAll = async (sn) => {
            const resolvedSn = await node.resolveMainSn(sn);
            return client.getDevicePropertiesPlain(resolvedSn);
        };
        node.queryDeviceList = () => client.requestHandler.get(client.deviceListUrl);
        node.setQuotaSelective = (sn, values) => client.setCommandPlain({sn: sn, ...values });
        node.queryMqttCert =  () => client.getMqttCredentials()
        node.getSpecificDevice = (sn) => client.getDevice(sn);
    }

    RED.nodes.registerType("ecoflow-api-server", RemoteServerNode, {
        credentials: {
            access_key: { type: "text" },
            secret_key: { type: "password" }
            }
        }
    );
}
