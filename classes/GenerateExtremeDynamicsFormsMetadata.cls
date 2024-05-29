/*****************************************************************************************************
* @Name         GenerateExtremeDynamicsFormsMetadata
* @TestClass    GenerateExtremeDynamicsFormsMetadataTest
* @Author       Muralidhar Sampathirao
* @Year         2023
* @Description  This class generates the EDF configurations record provided the sObject api name and 
                Page Layout Name.
******************************************************************************************************/
/* MODIFICATION LOG
* Version          Developer           Date               Description
*------------------------------------------------------------------------------------------------------
******************************************************************************************************/
global with sharing class GenerateExtremeDynamicsFormsMetadata {
    public GenerateExtremeDynamicsFormsMetadata() {

    }
    
    @InvocableMethod(label='Generate EDFMetadata' description='')
    global static List<EDFMetadataResult> createEDFMetadata(List<EDFMetadataRequest> requestList){

        List<EDFMetadataResult> resultList = new List<EDFMetadataResult>();
        for(EDFMetadataRequest request:requestList){
            resultList.add(createEDFMetadataSingle(request));
        }

        return resultList;
   
    }

    static EDFMetadataResult createEDFMetadataSingle(EDFMetadataRequest request){

        EDFMetadataResult result = new EDFMetadataResult();
        String formVersionId = '';
        String formDefinitionObject = '';
        String formDefinitionPageLayout = '';

        try{

            formVersionId = request.formVersionId;
            formDefinitionObject = request.objectApiName;
            formDefinitionPageLayout = request.pageLayout;

            String layoutName=String.format('{0}-{1}', new String[]{formDefinitionObject, formDefinitionPageLayout}); 
            List<Metadata.Metadata> layouts = Metadata.Operations.retrieve(Metadata.MetadataType.Layout, new List<String> {layoutName});
            List<String> fields=new List<String>();
            if(layouts.size()>0){
                Metadata.Layout layoutMd = (Metadata.Layout)layouts.get(0);
                Integer sectionnum=0;
                List<Form_Container__c> containers = new List<Form_Container__c>();
                List<Form_Element__c> formElements = new List<Form_Element__c>();

                List<SObject> compositeArray = new List<SObject>();


                for (Metadata.LayoutSection section : layoutMd.layoutSections) {
                    sectionnum++;
                    Form_Container__c container = new Form_Container__c();
                    if(Schema.sObjectType.Form_Container__c.fields.Container_Sequence__c.isCreateable())
                        container.Container_Sequence__c = sectionnum;
                    if(Schema.sObjectType.Form_Container__c.fields.Form_Container_External_Id__c.isCreateable())
                        container.Form_Container_External_Id__c = formVersionId+' Section-'+sectionnum;
                    if(Schema.sObjectType.Form_Container__c.fields.Title__c.isCreateable())
                        container.Title__c = section.label;
                    if(Schema.sObjectType.Form_Container__c.fields.Form_Definition_Version__c.isCreateable())
                        container.Form_Definition_Version__c = formVersionId;
                    if(Schema.sObjectType.Form_Container__c.fields.Active__c.isCreateable())
                        container.Active__c = true;

                    if(Schema.sObjectType.Form_Container__c.fields.Column_Style__c.isCreateable()){
                        if(section.style == Metadata.LayoutSectionStyle.CustomLinks)
                            container.Column_Style__c = 'CustomLinks';
                        else if(section.style == Metadata.LayoutSectionStyle.OneColumn)
                            container.Column_Style__c = 'OneColumn';
                        else if(section.style == Metadata.LayoutSectionStyle.TwoColumnsLeftToRight)
                            container.Column_Style__c = 'TwoColumnsLeftToRight';
                        else if(section.style == Metadata.LayoutSectionStyle.TwoColumnsTopToBottom)
                            container.Column_Style__c = 'TwoColumnsTopToBottom';
                    }

                    containers.add(container);

                    Integer columnnum=0;
                    Integer elementSequence = 0;
                    for (Metadata.LayoutColumn column : section.layoutColumns) {
                        columnnum++;
                        if (column.layoutItems != null) {
                            
                            for (Metadata.LayoutItem item : column.layoutItems) {
                                elementSequence++;
                                fields.add(item.field);
                                if(item.field!=null){
                                    Form_Element__c formElement = new Form_Element__c();

                                    if(Schema.sObjectType.Form_Element__c.fields.Column__c.isCreateable())
                                        formElement.Column__c = columnnum+'';
                                    if(Schema.sObjectType.Form_Element__c.fields.Sequence__c.isCreateable() )
                                        formElement.Sequence__c=elementSequence;
                                    if(Schema.sObjectType.Form_Element__c.fields.field_api_name__c.isCreateable())
                                        formElement.field_api_name__c = item.field;

                                    Form_Container__c containeRreference = new Form_Container__c(Form_Container_External_Id__c = formVersionId+' Section-'+sectionnum);
                                    if(Schema.sObjectType.Form_Element__c.fields.Section__c.isCreateable())
                                        formElement.Section__r = containeRreference;
                                    if(Schema.sObjectType.Form_Element__c.fields.Active__c.isCreateable())    
                                        formElement.Active__c = true;
                                    formElements.add(formElement);
                                }
                            }
                        }
                    }
                }

                SObjectAccessDecision decision = Security.stripInaccessible(
                                                                AccessType.READABLE,
                                                                containers
                                                            );
                containers = decision.getRecords();
                compositeArray.addAll(containers);

                decision = Security.stripInaccessible(
                                                                AccessType.READABLE,
                                                                formElements
                                                            );
                formElements = decision.getRecords();
                compositeArray.addAll(formElements);
            
                

                if( Form_Container__c.sObjectType.getDescribe().isUpdateable() && 
                    Form_Element__c.sObjectType.getDescribe().isUpdateable()
                ){
                    Database.SaveResult[] results = Database.insert(compositeArray,AccessLevel.USER_MODE);
                    result.formVersionId = formVersionId;
                    result.success = true;
                    result.message = 'Metadata Created successfully';
                }
                else{
                    result.formVersionId = formVersionId;
                    result.success = false;
                    result.message = 'User do not have permission to create EDF Metadata.';
                    return result;
                }
            
            }
            else{
                result.formVersionId = formVersionId;
                result.success = false;
                result.message = 'Metadata creation failed. Reason: Invalid sObject and/or Reference Page Layout';
            }
            return result;
        }
        catch(Exception e){
            result.formVersionId = formVersionId;
            result.success = false;
            result.message = e.getMessage();
            return result;
        }
        

    }
    
    
    global class EDFMetadataRequest{
        
        @InvocableVariable
        global String formVersionId;

        @InvocableVariable
        global String objectApiName;
        
        @InvocableVariable
        global String  pageLayout;
    }
    
    global class EDFMetadataResult{
        @InvocableVariable
        global String formVersionId;
        
        @InvocableVariable
        global Boolean success;

        @InvocableVariable
        global String message;
    }
}