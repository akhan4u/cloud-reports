import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class RDSReservedInstancesCollector extends BaseCollector {
    public collect() {
        return this.getAllInstances();
    }

    private async getAllInstances() {

        const serviceName = "RDS";
        const rdsRegions = this.getRegions(serviceName);
        const reserved_instances = {};

        for (const region of rdsRegions) {
            try {
                const rds = this.getClient(serviceName, region) as AWS.RDS;
                let fetchPending = true;
                let marker: string | undefined;
                reserved_instances[region] = [];
                while (fetchPending) {
                    const instancesResponse: AWS.RDS.ReservedDBInstanceMessage =
                        await rds.describeReservedDBInstances({ Marker: marker }).promise();
                    if (instancesResponse && instancesResponse.ReservedDBInstances) {
                        reserved_instances[region] =
                            reserved_instances[region].concat(instancesResponse.ReservedDBInstances);
                    }
                    marker = instancesResponse.Marker;
                    fetchPending = marker !== undefined && marker !== null;
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
                continue;
            }
        }
        return { reserved_instances };
    }
}
