SELECT
   CASE
      WHEN
         F.ISFOREIGN
      THEN
         RO.ALIAS || F.ID || '.' || RF.NAME
      ELSE
         O.ALIAS || '.' || F.NAME
   END
   AS 'field',
   CASE
      WHEN
         F.ISFOREIGN = 1
      THEN
         'LEFT JOIN ' || RS.NAME || '.' || RO.NAME || ' ' || RO.ALIAS || F.ID || ' ON ' || O.ALIAS || '.' || F.NAME || ' = ' || RO.ALIAS || F.ID || '.ID'
      ELSE
         ''
   END
   AS 'join', F.NAME AS 'name', DT.NAME as 'type'
FROM
   CONF.FIELD F
   INNER JOIN
      CONF.OBJECT O
      ON F.PARENT_OBJECT = O.ID
   INNER JOIN
      CONF.DATATYPE DT
      ON F.DATATYPE = DT.ID
   LEFT JOIN
      CONF.DATADEFAULT DD
      ON F.DATADEFAULT = DD.ID
   LEFT JOIN
      CONF.OBJECT RO
      ON F.REFERENCED_OBJECT = RO.ID
   LEFT JOIN
      CONF.SCHEMA RS
      ON RO.SCHEMA = RS.ID
   LEFT JOIN
      CONF.FIELD RF
      ON F.REFERENCED_FIELD = RF.ID
WHERE
   F.PARENT_OBJECT = :id_object
