import * as AWS from "aws-sdk";
import { AWSErrorHandler } from "../../../utils/aws";
import { BaseCollector } from "../../base";

export class CertificateCollector extends BaseCollector {
    public collect(callback: (err?: Error, data?: any) => void) {
        return this.getAllCertificates();
    }

    private async getAllCertificates() {

        const serviceName = "ACM";
        const acmRegions = this.getRegions(serviceName);
        const certificates = {};

        for (const region of acmRegions) {
            try {
                const acm = this.getClient(serviceName, region) as AWS.ACM;
                certificates[region] = [];
                let fetchPending = true;
                let marker: string | undefined;
                while (fetchPending) {
                    const certificatesResponse: AWS.ACM.ListCertificatesResponse = await acm.listCertificates({
                        NextToken: marker,
                    }).promise();
                    if (certificatesResponse.CertificateSummaryList) {
                        certificates[region] = certificates[region].concat(certificatesResponse.CertificateSummaryList);
                    }
                    marker = certificatesResponse.NextToken;
                    fetchPending = marker !== undefined;
                }
            } catch (error) {
                AWSErrorHandler.handle(error);
                continue;
            }
        }
        return { certificates };
    }
}
