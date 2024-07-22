/*****************************************************************************************************
* @Name         ExtremeDynamicFormsController
* @TestClass    ExtremeDynamicFormsControllerTest
* @Author       Muralidhar Sampathirao
* @Year         2023
* @Description  This acts as a controller for extremeDynamicFormsLwc to retrieve EDF Configurations
                and also to fetch Form Versions for Design Attributes datasource of the same component.
******************************************************************************************************/
/* MODIFICATION LOG
* Version          Developer           Date               Description
*------------------------------------------------------------------------------------------------------
******************************************************************************************************/
public with sharing class ExtremeDynamicFormsController extends VisualEditor.DynamicPickList{
    public ExtremeDynamicFormsController() {

    }

    public override VisualEditor.DataRow getDefaultValue(){
        VisualEditor.DataRow defaultValue = new VisualEditor.DataRow('No Form Version', 'NFV');
        return defaultValue;
    }

    public override VisualEditor.DynamicPickListRows getValues() {

        List<Form_Definition_version__c> fdvs = [SELECT Id, Name,Short_Description__c, Form_Definition__r.Name FROM Form_Definition_Version__c WITH SECURITY_ENFORCED];
        VisualEditor.DynamicPickListRows  myValues = new VisualEditor.DynamicPickListRows();
        for(Form_Definition_version__c fdv: fdvs){
            String title = ((fdv.Short_Description__c!=null && fdv.Short_Description__c!=''))?('('+fdv.Short_Description__c+')'):'';
            VisualEditor.DataRow value = new VisualEditor.DataRow(fdv.Form_Definition__r.Name+':'+fdv.Name + title, fdv.Name);
            myValues.addRow(value);
        }
        
        return myValues;
    }


    @AuraEnabled
    public static String getFormMetadata(String currentRecordId, String formVersionName){
        try{

        Id recId = currentRecordId;
        Map<String,List<sObject>> myMap = new  Map<String,List<sObject>>();

            List<Form_Container__c> fcs = 
            [
                SELECT  Id,
                        Title__c,
                        Name,
                        Decision_Expression__c,
                        Container_Sequence__c,
                        Container_Key__c,
                        Related_List_Container__c,
                        Object_API_Name__c,
                        Related_Field_API_Name__c,
                        Filter_Condition__c,
                        Form_Definition_Version__r.Read_Only_Form__c,
                        Form_Definition_Version__r.Form_Definition__r.Object_API_Name__c,
                        (   
                            SELECT  Id,
                                    Name,
                                    Decision_Expression__c,
                                    Section__c,Column__c,
                                    Field_API_Lower_Case__c,
                                    field_api_name__c,
                                    Sequence__c,
                                    Record_Gear_Key_Mapping__c,
                                    Hidden__c,
                                    HTML_Snippet__c,
                                    HTML_Snippet_Code__c,
                                    Custom_Label__c,
                                    Read_Only__c,
                                    Required__c,
                                    Form_Element_Key__c,
                                    Column_Type__c
                            FROM Form_Elements__r 
                            WHERE Active__c=true ORDER BY Sequence__c
                        ) 
                FROM Form_Container__c 
                WHERE Form_Definition_version__r.Name = :formVersionName
                AND Form_Definition_version__r.Active__c = true 
                AND Active__c=true 
                WITH SECURITY_ENFORCED
                ORDER BY Container_Sequence__c
                
            ];
            
            if(fcs.size()>0){

                String query = 'SELECT ';
                List<String> fields = new List<String>();
                fields.add('Id');
                for(Form_Container__c fc: fcs){
                    /** 
                     * If container is for a related list then we don't need to query the related form elements
                     * since those fields will be queried as part of related list component
                     **/
                    if(!fc.Related_List_Container__c){
                        for(Form_Element__c fe: fc.Form_Elements__r){
                            if(!fields.contains(fe.field_api_name__c) && fe.field_api_name__c!=null)
                                fields.add(fe.field_api_name__c);
                        }
                    }
                }

                List<SObject> record = new List<SObject>();
                if(recId!=null){
                    String objApiName = String.valueOf(recId.getSobjectType());

                    if(objApiName != fcs[0].Form_Definition_Version__r.Form_Definition__r.Object_API_Name__c){
                        throw new EDFException('Incompatible Form Version: '+formVersionName+'. sObject on Form Defintion: '+
                                                    fcs[0].Form_Definition_Version__r.Form_Definition__r.Object_API_Name__c+' is not same as record sObject: '+objApiName);
                    }

                    System.debug('\n\n =========== sObject type:'+objApiName);
                    query = query + String.join(fields,',')+' FROM '+objApiName+' WHERE Id=:currentRecordId';
                    System.debug('\n\n----- Query :'+query);
                    record = Database.query(String.escapeSingleQuotes(query));
                    SObjectAccessDecision decision = Security.stripInaccessible(
                                                                    AccessType.READABLE,
                                                                    record
                                                                );
                    record = decision.getRecords();
                }
                
                myMap.put('definition',fcs);
                myMap.put('record',record);

                
                return JSON.serialize(myMap);
    
            }
            else{
                throw new EDFException('Could not find form version: '+formVersionName+'. Its either deleted or not in Acive state');
            }

            
        }catch(EDFException e){
            throw new EDFException(e.getMessage());
        }
        catch(Exception e){
            throw e;
        }
        
    }

    public class EDFException extends Exception {
        
    }

    @AuraEnabled(cacheable=true)
    public static Boolean getUserContextDecision(String userDecisionClass,String recordId) {
        System.debug('\n\n ************ userDecisionClass:'+userDecisionClass);

        try{

            Type subscriberImplementation = Type.forName(userDecisionClass);
            Type edfInterface = UserContextInterface.class;
            UserContextInterface userContextInstance;

            if(subscriberImplementation == null){
                throw new SecurityException('Class '+userDecisionClass+' is either missing or is not a valid implementation of UserContextInterface');
            }
            
            Boolean validImplementation = edfInterface.isAssignableFrom(subscriberImplementation);

            if(!validImplementation){
                throw new SecurityException('Cannot create instance of '+userDecisionClass+'. It does not implement UserContextInterface');
            }else{
                userContextInstance =  (UserContextInterface) subscriberImplementation.newInstance();
            }
            

            
            //UserContextInterface userContextInstance = (UserContextInterface) Type.forName(userDecisionClass).newInstance();
            return userContextInstance.getUserContextDecision(recordId);

        }catch(Exception e){
            throw e;
        }

    }
}