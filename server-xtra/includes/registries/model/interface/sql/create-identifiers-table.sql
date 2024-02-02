CREATE TABLE IF NOT EXISTS `webapp_registries_identifiers` (
  `IdentifierId` int(11) NOT NULL AUTO_INCREMENT,
  `IdentifierUUID` varchar(36) NOT NULL,
  `IdentifierStatus` int(11) NOT NULL,
  `DidKey` varchar(256) NOT NULL,

  PRIMARY KEY (`IdentifierId`),
  UNIQUE KEY `DidKey` (`DidKey`),
  UNIQUE KEY `IdentifierUUID` (`IdentifierUUID`)
);