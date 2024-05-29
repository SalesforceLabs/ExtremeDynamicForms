@isTest
private class ExtremeDynamicFormsControllerTest {

    @TestSetup
    static void makeData(){

        Form_Definition__c fd = 
            new Form_Definition__c(
                    Object_API_Name__c = 'edf__Form_Element__c',
                    Reference_Page_Layout__c = 'Form Element Layout'
                );
        insert fd;

        Form_Definition_Version__c fdv =
            new Form_Definition_Version__c(
                    Form_Definition__c = fd.Id,
                    Active__c = true,
                    Short_Description__c = 'Form Version for edf__Form_Element__c'
                );
        
        insert fdv;

        
        GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest metadataReq = new GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest();
        metadataReq.formVersionId = fdv.Id;
        metadataReq.objectApiName = fd.Object_API_Name__c;
        metadataReq.pageLayout = fd.Reference_Page_Layout__c;
        
        GenerateExtremeDynamicsFormsMetadata.createEDFMetadata(new List<GenerateExtremeDynamicsFormsMetadata.EDFMetadataRequest>{metadataReq});
        
    }
    
    @isTest
    static void testGetFormMetadata(){

        Form_Definition_Version__c fdv = [Select Id, Name FROM Form_Definition_Version__c LIMIT 1];
        Form_Element__c feTheRecord = [Select Id FROM Form_Element__c LIMIT 1];

        Test.startTest();

        ExtremeDynamicFormsController.getFormMetadata(feTheRecord.Id, fdv.Name);

        Test.stopTest();
    }

    @isTest
    static void testGetFormMetadataIncompatibleFormVersion(){

        Form_Definition_Version__c fdv = [Select Id, Name FROM Form_Definition_Version__c LIMIT 1];
        
        Test.startTest();

        try{
            ExtremeDynamicFormsController.getFormMetadata(fdv.Id, fdv.Name);
        }catch(Exception e){
            System.assertEquals('Incompatible Form Version: '+fdv.Name+'. sObject on Form Defintion: edf__Form_Element__c is not same as record sObject: edf__Form_Definition_Version__c', e.getMessage());
        }

        Test.stopTest();
    }

    @isTest
    static void testGetFormMetadataInactiveFormVersion(){

        Form_Definition_Version__c fdv = [Select Id, Active__c, Name FROM Form_Definition_Version__c LIMIT 1];
        Form_Element__c feTheRecord = [Select Id FROM Form_Element__c LIMIT 1];

        fdv.Active__c = false;
        update fdv;

        
        Test.startTest();

        try{
            ExtremeDynamicFormsController.getFormMetadata(feTheRecord.Id, fdv.Name);
        }catch(Exception e){
            System.assertEquals('Could not find form version: '+fdv.Name+'. Its either deleted or not in Acive state', e.getMessage());
        }

        Test.stopTest();
    }

    @isTest
    static void testGetValues(){

        Test.startTest();

        ExtremeDynamicFormsController edfCtrlr = new ExtremeDynamicFormsController();
        VisualEditor.DynamicPickListRows myValues = edfCtrlr.getValues();

        System.assert(myValues!=null);

        Test.stopTest();

    }

    @isTest
    static void testGetDefaultValues(){

        Test.startTest();

        ExtremeDynamicFormsController edfCtrlr = new ExtremeDynamicFormsController();
        VisualEditor.DataRow defaultValue = edfCtrlr.getDefaultValue();

        System.assert(defaultValue!=null);

        Test.stopTest();

    }
    
}