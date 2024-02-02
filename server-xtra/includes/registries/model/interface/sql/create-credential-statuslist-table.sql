CREATE TABLE IF NOT EXISTS `webapp_registries_credential_statuslist` (
  `StatusId` int(11) NOT NULL AUTO_INCREMENT,
  `CredentialHash` varchar(128) NOT NULL,
  `CredentialStatus` int(11) NOT NULL,
  `ModifiedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ModifiedBy` int(11) NOT NULL,

  PRIMARY KEY (`StatusId`)
);