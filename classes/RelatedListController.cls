public with sharing class RelatedListController {
    public static final String FIELDS_PARAM = 'fields';
    public static final String NUMBER_OF_RECORDS_PARAM = 'numberOfRecords';
    public static final String RECORD_ID_PARAM = 'recordId';
    public static final String SOBJECT_API_NAME_PARAM = 'sobjectApiName';
    public static final String SOBJECT_LABEL_PARAM = 'sobjectLabel';
    public static final String SOBJECT_LABEL_PLURAL_PARAM = 'sobjectLabelPlural';
    public static final String PARENT_RELATIONSHIP_API_NAME_PARAM = 'parentRelationshipApiName';
    public static final String RELATED_FIELD_API_NAME_PARAM = 'relatedFieldApiName';
    public static final String SORTED_DIRECTION_PARAM = 'sortedDirection';
    public static final String SORTED_BY_PARAM = 'sortedBy';
    public static final String RECORDS_PARAM = 'records';
    public static final String ICON_NAME_PARAM = 'iconName';
    public static final String RELATED_LIST_FILTER = 'relatedListFilter';

    @AuraEnabled
    public static String initData(String jsonData){
        try{
            Map<String, Object> requestMap = (Map<String, Object>)JSON.deserializeUntyped(jsonData);  
            Map<String, Object> responseMap = new Map<String, Object>();
            responseMap.put(RECORDS_PARAM, getRecords(jsonData));
            
            String sobjectApiName = (String)requestMap.get(SOBJECT_API_NAME_PARAM);
            responseMap.put(ICON_NAME_PARAM, getIconName(sobjectApiName));
            String recordId = (String)requestMap.get(RECORD_ID_PARAM);
            String relatedFieldApiName = (String)requestMap.get(RELATED_FIELD_API_NAME_PARAM);
            responseMap.put(PARENT_RELATIONSHIP_API_NAME_PARAM, getParentRelationshipName(recordId, sobjectApiName, relatedFieldApiName));

            Schema.SObjectType sobjectType = Schema.getGlobalDescribe().get(sobjectApiName);
            Schema.DescribeSObjectResult sobjectDescribe = sobjectType.getDescribe();
            responseMap.put(SOBJECT_LABEL_PARAM, sobjectDescribe.getLabel());
            responseMap.put(SOBJECT_LABEL_PLURAL_PARAM, sobjectDescribe.getLabelPlural());
            return JSON.serialize(responseMap);
        }catch(Exception e){
            throw e;
        }
    }
    
	@AuraEnabled
    public static List<Sobject> getRecords(String jsonData){

        try{
            Map<String, Object> root = (Map<String, Object>)JSON.deserializeUntyped(jsonData);  
            String fields = (String)root.get(FIELDS_PARAM);
            /*
            if(!fields.toLowerCase().contains('name')){
                fields = fields + ((fields!=null && fields!='')?',Name ':' Name ');
            }
            */
            Integer numberOfRecords = (Integer)root.get(NUMBER_OF_RECORDS_PARAM);
            String recordId = (String)root.get(RECORD_ID_PARAM);
            String relatedFieldApiName = (String)root.get(RELATED_FIELD_API_NAME_PARAM);
            String sobjectApiName = (String)root.get(SOBJECT_API_NAME_PARAM);        
            String orderBy = (String)root.get(SORTED_BY_PARAM) + ' ' + (String)root.get(SORTED_DIRECTION_PARAM);
            String relatedListFilter = (String)root.get(RELATED_LIST_FILTER);

            relatedListFilter = (relatedListFilter!=null && relatedListFilter!='')?' AND '+ relatedListFilter:'';
            relatedListFilter = String.escapeSingleQuotes(relatedListFilter).replaceAll('"','\'');

            String query =  'SELECT ' + String.escapeSingleQuotes(fields) + 
                            ' FROM ' + String.escapeSingleQuotes(sobjectApiName) + 
                            ' WHERE ' + String.escapeSingleQuotes(relatedFieldApiName) + '= :recordId' +
                            relatedListFilter + ' ORDER BY ' + String.escapeSingleQuotes(orderBy) +' LIMIT :numberOfRecords';

            System.debug('>>>>>>:'+query);
            List<SObject> records = new List<SObject>();
            records = Database.query(query);
            System.debug('>>>>>> records:'+records);

            SObjectAccessDecision decision = Security.stripInaccessible(
                                                                        AccessType.READABLE,
                                                                        records
                                                                    );
            
            return decision.getRecords();
        }catch(Exception e){
            throw e;
        }
	}
        
    private static String getParentRelationshipName(Id recordId, String childSobjectApiName, String relatedFieldApiName){
        Schema.DescribeSObjectResult descrRes = recordId.getSObjectType().getDescribe();
        String name;
        for (Schema.ChildRelationship cr: descrRes.getChildRelationships()){ 
            if(cr.getChildSObject().getDescribe().getName() == childSobjectApiName
            && cr.getField().getDescribe().getName() == relatedFieldApiName){
          	 	name = cr.getRelationshipName();
                break;
            }
        }     
        return name;
    }      
    
    @AuraEnabled
    public static String getIconName(String sobjectApiName){
        String iconName;
        try{
            List<Schema.DescribeTabSetResult> tabSetDesc = Schema.DescribeTabs();
            List<Schema.DescribeTabResult> tabDesc = new List<Schema.DescribeTabResult>();
            List<Schema.DescribeIconResult> iconDesc = new List<Schema.DescribeIconResult>();

            for(Schema.DescribeTabSetResult tsr : tabSetDesc) { 
                tabDesc.addAll(tsr.getTabs()); 
            }

            for(Schema.DescribeTabResult tr : tabDesc) {
                if( sobjectApiName == tr.getSobjectName() ) {
                    if( tr.isCustom() ) {
                        iconDesc.addAll(tr.getIcons());
                    } else {
                        iconName = 'standard:' + sobjectApiName.toLowerCase();
                    }
                }
            }
            for (Schema.DescribeIconResult ir : iconDesc) {
                if (ir.getContentType() == 'image/svg+xml'){
                    iconName = 'custom:' + ir.getUrl().substringBetween('custom/','.svg').substringBefore('_');
                    break;
                }
            }
            return iconName;
        }catch(Exception e){
            throw e;
        }
    }    
    
}