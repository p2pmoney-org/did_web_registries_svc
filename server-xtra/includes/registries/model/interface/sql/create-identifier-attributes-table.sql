CREATE TABLE IF NOT EXISTS `webapp_registries_identifier_attributes` (
  `AttributeId` int(11) NOT NULL AUTO_INCREMENT,
  `AttributeUUID` varchar(36) NOT NULL,
  `AttributeStatus` int(11) NOT NULL,
  `IdentifierId` int(11) NOT NULL,
  `Attribute` varchar(1024) NOT NULL,
  `ReporterLevel` int(11) DEFAULT 0,
  `ReporterIdentifierId` int(11) NOT NULL,
  `ReporterSignature` varchar(256),

  PRIMARY KEY (`AttributeId`),
  UNIQUE KEY `AttributeUUID` (`AttributeUUID`)
);