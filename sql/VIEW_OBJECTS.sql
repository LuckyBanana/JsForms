SELECT
   O.ID id,
   S.NAME schema,
   O.NAME name,
   O.LABEL label,
   O.ALIAS alias,
   O.APIURL apiUrl,
   O.VIEW_ID viewId,
   O.ISDEFAULT "default",
   O.ISACTIVABLE activable,
   O.POS pos,
   G.NAME "group",
   G.ID groupId,
   O.CUSTOM custom,
   O.ISFORM "isform",
   COALESCE(F.FIELDS, JSON_ARRAY()) fields
FROM
   OBJECT O
   INNER JOIN
      SCHEMA S
      ON O.SCHEMA = S.ID
   LEFT JOIN
      (
         SELECT
            PARENT_OBJECT,
            JSON_GROUP_ARRAY(JSON_OBJECT('id', ID, 'name', NAME, 'label', LABEL, 'type', DATATYPE, 'generated', ISGENERATED, 'default', DATADEFAULT, 'foreign', ISFOREIGN, 'referencedObject', REFERENCED_OBJECT, 'referencedField', REFERENCED_FIELD, 'pos', POS, 'parentObject', PARENT_OBJECT, 'hidden', HIDDEN, 'required', REQUIRED) ) FIELDS
         FROM
            (
               SELECT
                  F.PARENT_OBJECT,
                  F.ID,
                  F.NAME,
                  F.LABEL,
                  DT.NAME AS DATATYPE,
                  F.ISGENERATED,
                  DD.NAME AS DATADEFAULT,
                  F.ISFOREIGN,
                  --F.REFERENCED_OBJECT,
                  --F.REFERENCED_FIELD,
                  RO.NAME REFERENCED_OBJECT,
                  RF.NAME REFERENCED_FIELD,
                  F.POS,
                  F.HIDDEN,
                  F.REQUIRED
               FROM
                  FIELD F
                  LEFT JOIN
                     DATATYPE DT
                     ON F.DATATYPE = DT.ID
                  LEFT JOIN
                     DATADEFAULT DD
                     ON F.DATADEFAULT = DD.ID
                  LEFT JOIN
                    FIELD RF ON F.REFERENCED_FIELD = RF.ID
                  LEFT JOIN
                    OBJECT RO ON F.REFERENCED_OBJECT = RO.ID
               ORDER BY
                  F.POS
            )
            FIELDS
         GROUP BY
            PARENT_OBJECT
      )
      F
      ON O.ID = F.PARENT_OBJECT
   LEFT JOIN
      OBJECTGROUP G
      ON O.PARENT_GROUP = G.ID
