@isTest
private class GenerateExtremeDynamicsFormsMetadataTest {

    @TestSetup
    static void makeData(){

        Form_Definition__c fd = 
            new Form_Definition__c(
                    Object_API_Name__c = 'Form_Element__c',
                    Reference_Page_Layout__c = 'Form Element Layout'
                );
        insert fd;

        Form_Definition_Version__c fe =
            new Form_Definition_Version__c(
                    Form_Definition__c = fd.Id,
                    Active__c = true,
                    Short_Description__c = 'Form Version for Form_Element__c'
                );
        
        insert fe;
    }

    @isTest
    static void testCreateEDFMetadata(){

        Form_Definition_Version__c fdv = [Select 
                                            Id, 
                                            Form_Definition__r.Object_API_Name__c,
                                            Form_Definition__r.Reference_Page_Layout__c,
                                            Name 
                                            FROM Form_Definition_Version__c 
                                            LIMIT 1
                                        ];
        
        Test.startTest();

        GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest metadataReq = new GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest();
        metadataReq.formVersionId = fdv.Id;
        metadataReq.objectApiName = fdv.Form_Definition__r.Object_API_Name__c;
        metadataReq.pageLayout = fdv.Form_Definition__r.Reference_Page_Layout__c;
        
        List<GenerateExtremeDynamicsFormsMetadata.EDFMetadataResult> results =
            GenerateExtremeDynamicsFormsMetadata.createEDFMetadata(new List<GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest>{metadataReq});
        
        System.assert(results.size()>0);
        System.assertEquals(metadataReq.formVersionId,results[0].formVersionId);
        System.assertEquals(true,results[0].success);
        System.assertEquals('Metadata Created successfully',results[0].message);
        
        Test.stopTest();
    }

    @isTest
    static void testCreateEDFMetadataFail(){

        Form_Definition_Version__c fdv = [Select 
                                            Id, 
                                            Form_Definition__r.Object_API_Name__c,
                                            Form_Definition__r.Reference_Page_Layout__c,
                                            Name 
                                            FROM Form_Definition_Version__c 
                                            LIMIT 1
                                        ];
        
        Test.startTest();

        GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest metadataReq = new GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest();
        metadataReq.formVersionId = fdv.Id;
        metadataReq.objectApiName = fdv.Form_Definition__r.Object_API_Name__c;
        metadataReq.pageLayout = 'Dummy Page Layout';
        
        List<GenerateExtremeDynamicsFormsMetadata.EDFMetadataResult> results =
            GenerateExtremeDynamicsFormsMetadata.createEDFMetadata(new List<GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest>{metadataReq});
        
        System.assert(results.size()>0);
        System.assertEquals(metadataReq.formVersionId,results[0].formVersionId);
        System.assertEquals(false,results[0].success);
        System.assertEquals('Metadata creation failed. Reason: Invalid sObject and/or Reference Page Layout',results[0].message);
        
        Test.stopTest();
    }
    
}