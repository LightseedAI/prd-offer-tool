import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2 solid #E2E8F0', paddingBottom: 20 },
  logo: { width: 120, objectFit: 'contain' },
  headerText: { alignItems: 'flex-end' },
  title: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#DC2626', textTransform: 'uppercase' }, // PRD Red
  subTitle: { fontSize: 10, color: '#64748B' },
  
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1E293B', borderBottom: '1 solid #E2E8F0', marginBottom: 8, paddingBottom: 4, textTransform: 'uppercase' },
  
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { width: '30%', fontFamily: 'Helvetica-Bold', color: '#64748B' },
  value: { width: '70%', fontFamily: 'Helvetica' },
  
  // Signature specific styles
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  signatureBox: { width: '48%' },
  signatureImage: { height: 50, marginBottom: 5 }, 
  signatureLine: { borderBottom: '1 solid #94A3B8', marginTop: 0 },
  signatureLabel: { fontSize: 8, color: '#64748B', marginTop: 4, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' }
});

export const OfferPdfDocument = ({ formData, logoUrl }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Image src={logoUrl} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Offer to Purchase</Text>
          <Text style={styles.subTitle}>Official Letter of Offer</Text>
        </View>
      </View>

      {/* PROPERTY DETAILS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Property Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Property Address:</Text>
          <Text style={styles.value}>{formData.propertyAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Agent:</Text>
          <Text style={styles.value}>{formData.agentName}</Text>
        </View>
      </View>

      {/* BUYER DETAILS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buyer Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Full Name (1):</Text>
          <Text style={styles.value}>{formData.buyerName1}</Text>
        </View>
        {formData.buyerName2 && (
          <View style={styles.row}>
            <Text style={styles.label}>Full Name (2):</Text>
            <Text style={styles.value}>{formData.buyerName2}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{formData.buyerAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{formData.buyerPhone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{formData.buyerEmail}</Text>
        </View>
      </View>

       {/* PRICE & DEPOSIT */}
       <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price & Deposit</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Purchase Price:</Text>
          <Text style={styles.value}>{formData.purchasePrice}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Initial Deposit:</Text>
          <Text style={styles.value}>{formData.depositAmount}</Text>
        </View>
        <View style={styles.row}>
            <Text style={styles.label}>Deposit Terms:</Text>
            <Text style={styles.value}>{formData.depositTerms}</Text>
        </View>
      </View>

      {/* CONDITIONS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conditions</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Finance Date:</Text>
          <Text style={styles.value}>{formData.financeDate} {formData.financePreApproved ? '(Pre-Approved)' : ''}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Building & Pest:</Text>
          <Text style={styles.value}>{formData.inspectionDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Settlement Date:</Text>
          <Text style={styles.value}>{formData.settlementDate}</Text>
        </View>
        {formData.specialConditions && (
            <View style={{ marginTop: 5 }}>
                <Text style={styles.label}>Special Conditions:</Text>
                <Text style={{ ...styles.value, width: '100%', marginTop: 2 }}>{formData.specialConditions}</Text>
            </View>
        )}
      </View>

      {/* SIGNATURE SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authorisation</Text>
        
        <View style={styles.signatureRow}>
          {/* Buyer 1 Signature */}
          <View style={styles.signatureBox}>
            {formData.signature ? (
                <Image src={formData.signature} style={styles.signatureImage} />
            ) : (
                <View style={{ height: 50 }} /> 
            )}
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Buyer 1 Signature</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>Date: {formData.signatureDate1}</Text>
          </View>

          {/* Buyer 2 Signature (Conditional) */}
          {formData.buyerName2 && (
            <View style={styles.signatureBox}>
              {formData.signature2 ? (
                <Image src={formData.signature2} style={styles.signatureImage} />
              ) : (
                <View style={{ height: 50 }} />
              )}
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Buyer 2 Signature</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}>Date: {formData.signatureDate2}</Text>
            </View>
          )}
        </View>
      </View>

    </Page>
  </Document>
);